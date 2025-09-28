import json
import secrets
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import base64
import requests
from integrations.integration_item import IntegrationItem

from redis_client import add_key_value_redis, get_value_redis, delete_key_redis


CLIENT_ID = '73f5ce38-3afc-4f7b-97b8-6f04a48c1de9'
CLIENT_SECRET = 'c8c33818-e27d-4f27-820d-1322151c0475'

REDIRECT_URI = 'http://localhost:8000/integrations/hubspot/oauth2callback'
SCOPES = 'crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read'
authorization_url = f'https://app.hubspot.com/oauth/authorize?client_id={CLIENT_ID}&response_type=code&scope={SCOPES}&redirect_uri={REDIRECT_URI}'

encoded_client_id_secret = base64.b64encode(f'{CLIENT_ID}:{CLIENT_SECRET}'.encode()).decode()

async def authorize_hubspot(user_id, org_id):
    """Initialize HubSpot OAuth flow"""
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode('utf-8')).decode('utf-8')
    
    # Store state in Redis for verification
    await add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', json.dumps(state_data), expire=600)
    
    auth_url = f'{authorization_url}&state={encoded_state}'
    return auth_url

async def oauth2callback_hubspot(request: Request):
    """Handle OAuth callback from HubSpot"""
    if request.query_params.get('error'):
        raise HTTPException(status_code=400, detail=request.query_params.get('error_description'))
    
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    
    if not code or not encoded_state:
        raise HTTPException(status_code=400, detail='Missing code or state parameter')
    
    # Decode state data
    state_data = json.loads(base64.urlsafe_b64decode(encoded_state).decode('utf-8'))
    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')
    
    # Verify state
    saved_state = await get_value_redis(f'hubspot_state:{org_id}:{user_id}')
    if not saved_state or original_state != json.loads(saved_state).get('state'):
        raise HTTPException(status_code=400, detail='State does not match.')
    
    # Exchange authorization code for access token
    async with httpx.AsyncClient() as client:
        response, _ = await asyncio.gather(
            client.post(
                'https://api.hubapi.com/oauth/v1/token',
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': REDIRECT_URI,
                    'client_id': CLIENT_ID,
                    'client_secret': CLIENT_SECRET,
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            ),
            delete_key_redis(f'hubspot_state:{org_id}:{user_id}'),
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail='Failed to exchange code for token')
    
    # Store credentials in Redis
    await add_key_value_redis(f'hubspot_credentials:{org_id}:{user_id}', json.dumps(response.json()), expire=600)
    
    # Close the popup window
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    """Retrieve and return stored HubSpot credentials"""
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials found.')
    
    credentials = json.loads(credentials)
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')
    
    return credentials

def create_integration_item_metadata_object(response_json: dict, item_type: str) -> IntegrationItem:
    """Create an IntegrationItem object from HubSpot API response"""
    properties = response_json.get('properties', {})
    
    # Get name based on item type
    if item_type == 'contact':
        firstname = properties.get('firstname', '')
        lastname = properties.get('lastname', '')
        name = f"{firstname} {lastname}".strip() or 'Unnamed Contact'
    elif item_type == 'company':
        name = properties.get('name', 'Unnamed Company')
    elif item_type == 'deal':
        name = properties.get('dealname', 'Unnamed Deal')
    else:
        name = f'HubSpot {item_type.title()}'
    
    integration_item_metadata = IntegrationItem(
        id=response_json.get('id'),
        name=name,
        type=item_type,
        creation_time=properties.get('createdate'),
        last_modified_time=properties.get('lastmodifieddate'),
        url=f"https://app.hubspot.com/contacts/your_hub_id/{item_type}s/{response_json.get('id')}"
    )
    
    return integration_item_metadata

def fetch_hubspot_objects(access_token: str, object_type: str, limit: int = 100) -> list:
    """Fetch objects from HubSpot CRM API"""
    url = f'https://api.hubapi.com/crm/v3/objects/{object_type}'
    headers = {'Authorization': f'Bearer {access_token}'}
    
    all_objects = []
    after = None
    
    while True:
        params = {'limit': limit}
        if after:
            params['after'] = after
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error fetching {object_type}: {response.status_code} - {response.text}")
            break
        
        data = response.json()
        results = data.get('results', [])
        all_objects.extend(results)
        
        # Check for pagination
        paging = data.get('paging', {})
        after = paging.get('next', {}).get('after')
        
        if not after:
            break
    
    return all_objects

async def get_items_hubspot(credentials) -> list[IntegrationItem]:
    """Fetch all HubSpot CRM objects and return as IntegrationItem list"""
    credentials = json.loads(credentials)
    access_token = credentials.get('access_token')
    
    if not access_token:
        raise HTTPException(status_code=400, detail='No access token found in credentials')
    
    list_of_integration_item_metadata = []
    
    # Define the object types to fetch
    object_types = ['contacts', 'companies', 'deals']
    
    for object_type in object_types:
        try:
            # Fetch objects from HubSpot
            objects = fetch_hubspot_objects(access_token, object_type)
            
            # Convert to IntegrationItem objects
            for obj in objects:
                item_type = object_type.rstrip('s')  # Remove 's' from plural
                integration_item = create_integration_item_metadata_object(obj, item_type)
                list_of_integration_item_metadata.append(integration_item)
                
        except Exception as e:
            print(f"Error processing {object_type}: {str(e)}")
            continue
    
    print(f'list_of_integration_item_metadata: {list_of_integration_item_metadata}')
    return list_of_integration_item_metadata