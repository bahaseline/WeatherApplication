import axios from 'axios';

export const apiCall = async (endpoint) => {
    const options = {
        method: 'GET',
        url: endpoint,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};
