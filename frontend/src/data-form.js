import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Card,
    CardContent,
    Chip,
    Grid,
    Paper,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material';
import axios from 'axios';

const endpointMapping = {
    'Notion': 'notion',
    'Airtable': 'airtable',
    'HubSpot': 'hubspot',
};

const loadEndpointMapping = {
    'Notion': 'load',
    'Airtable': 'load',
    'HubSpot': 'get_hubspot_items',
};

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRawData, setShowRawData] = useState(false);
    const endpoint = endpointMapping[integrationType];
    const loadEndpoint = loadEndpointMapping[integrationType];

    const handleLoad = async () => {
        try {
            setLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            const response = await axios.post(`http://localhost:8000/integrations/${endpoint}/${loadEndpoint}`, formData);
            const data = response.data;
            setLoadedData(data);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    const renderDataCards = (data) => {
        if (!Array.isArray(data)) return null;
        
        const groupedData = data.reduce((acc, item) => {
            const type = item.type || 'unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});

        return (
            <Box sx={{ mt: 3 }}>
                {Object.entries(groupedData).map(([type, items]) => (
                    <Box key={type} sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Typography variant="h6" color="primary">
                                {type.charAt(0).toUpperCase() + type.slice(1)}s
                            </Typography>
                            <Chip 
                                label={`${items.length} items`} 
                                size="small" 
                                color="primary" 
                            />
                        </Box>
                        <Grid container spacing={2}>
                            {items.slice(0, 6).map((item, index) => ( // Show max 6 items per type
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card 
                                        variant="outlined" 
                                        sx={{ 
                                            height: '100%',
                                            '&:hover': { 
                                                boxShadow: 2,
                                                transform: 'translateY(-2px)',
                                                transition: 'all 0.2s ease-in-out'
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap' 
                                            }}>
                                                {item.name || 'Unnamed Item'}
                                            </Typography>
                                            
                                            <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                                                <Chip 
                                                    label={item.type} 
                                                    size="small" 
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                                {item.id && (
                                                    <Chip 
                                                        label={`ID: ${item.id.substring(0, 8)}...`} 
                                                        size="small" 
                                                        variant="outlined"
                                                        color="secondary"
                                                    />
                                                )}
                                            </Box>
                                            
                                            {item.creation_time && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    📅 Created: {new Date(item.creation_time).toLocaleDateString()}
                                                </Typography>
                                            )}
                                            {item.last_modified_time && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    ✏️ Modified: {new Date(item.last_modified_time).toLocaleDateString()}
                                                </Typography>
                                            )}
                                            {item.url && (
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    <a 
                                                        href={item.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ textDecoration: 'none', color: '#1976d2' }}
                                                    >
                                                        🔗 View in {integrationType}
                                                    </a>
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        {items.length > 6 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                ... and {items.length - 6} more {type}s
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column' width='100%'>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 900, borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom color="primary" sx={{ textAlign: 'center', mb: 1 }}>
                    📊 {integrationType} Integration
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                    Load and explore your {integrationType} data
                </Typography>
                
                <Divider sx={{ mb: 3 }} />

                <Box display='flex' gap={2} mb={3} justifyContent="center">
                    <Button
                        onClick={handleLoad}
                        variant='contained'
                        disabled={loading}
                        size="large"
                        sx={{ minWidth: 140 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : '🔄 Load Data'}
                    </Button>
                    <Button
                        onClick={() => {
                            setLoadedData(null);
                            setError(null);
                            setShowRawData(false);
                        }}
                        variant='outlined'
                        disabled={!loadedData && !error}
                        size="large"
                        sx={{ minWidth: 140 }}
                    >
                        🗑️ Clear Data
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        ❌ Error: {error}
                    </Alert>
                )}

                {loadedData && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h5" color="success.main">
                                ✅ Successfully loaded {Array.isArray(loadedData) ? loadedData.length : 0} items
                            </Typography>
                            <Button
                                onClick={() => setShowRawData(!showRawData)}
                                variant="text"
                                size="small"
                            >
                                {showRawData ? 'Hide' : 'Show'} Raw JSON
                            </Button>
                        </Box>
                        
                        {showRawData ? (
                            <TextField
                                multiline
                                rows={15}
                                value={JSON.stringify(loadedData, null, 2)}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    sx: { 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.875rem',
                                        backgroundColor: 'grey.50'
                                    }
                                }}
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                        ) : (
                            renderDataCards(loadedData)
                        )}
                    </Box>
                )}

                {!loadedData && !loading && !error && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            🚀 Ready to load your {integrationType} data!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Click "Load Data" to get started
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}