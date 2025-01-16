import randomUseragent from 'random-useragent';
import axios from 'axios';
import axiosRetry from 'axios-retry'
import log from './logger.js';
import {
    newAgent
} from './helper.js'

const userAgent = randomUseragent.getRandom();
const headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://app.depined.org",
    "Referer": "https://app.depined.org/",
    "Priority": "u=1, i",
    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}

axiosRetry(axios, {
    retries: 3, // 设置重试次数
    retryDelay: axiosRetry.exponentialDelay, // 设置重试延迟策略
});

export const getIp = async (proxy) => {
    log.info(`Getting IP from ${proxy}`);
    const agent = newAgent(proxy);
    log.info(JSON.stringify(agent, null, 2));
    const response = await axios.get('http://ip-api.com/line/', {
        httpsAgent: agent,
        httpAgent: agent
    });
    log.info(response.data);
    return response.data.ip;
}

export const registerUser = async (email, password, proxy) => {
    const agent = newAgent(proxy);
    const url = 'https://api.depined.org/api/user/register';

    try {
        const response = await axios.post(url, { email, password }, {
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        log.info(JSON.stringify(response, null, 2));
        log.info('User registered successfully:', response.data.message);
        return response.data;
    } catch (error) {
        log.error('Error registering user:', error.response ? error.response.data : error.message);
        if (error.response) {
            return error.response.data;
        }
        return null;
    }
};

export const loginUser = async (email, password, proxy) => {
    const agent = newAgent(proxy);
    const url = 'https://api.depined.org/api/user/login';

    try {
        const response = await axios.post(url, { email, password }, {
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        log.info('User Login successfully:', response.data);
        return response.data;
    } catch (error) {
        log.error('Error Login user:', error.response ? error.response.data : error.message);
        return null;
    }
};

export const createUserProfile = async (token, payload, proxy) => {
    const agent = newAgent(proxy);
    const url = 'https://api.depined.org/api/user/profile-creation';

    try {
        const response = await axios.post(url, payload, {
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        log.info('Profile created successfully:', payload);
        return response.data;
    } catch (error) {
        log.error('Error creating profile:', error.response ? error.response.data : error.message);
        return null;
    }
};

export const confirmUserReff = async (token, referral_code, proxy) => {
    const agent = newAgent(proxy);
    const url = 'https://api.depined.org/api/access-code/referal';

    try {
        const response = await axios.post(url, { referral_code }, {
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        log.info('Confirm User referral successfully:', response.data.message);
        return response.data;
    } catch (error) {
        log.error('Error Confirm User referral:', error.response ? error.response.data : error.message);
        return null;
    }
};

export async function getUserInfo(token, proxy) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get('https://api.depined.org/api/user/details', {
            headers: {
                ...headers,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });

        return response.data;
    } catch (error) {
        log.error('Error fetching user info:', error.message || error);
        return null;
    }
}
export async function getUserRef(token, proxy) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get('https://api.depined.org/api/referrals/stats', {
            headers: {
                ...headers,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });

        return response.data;
    } catch (error) {
        log.error('Error fetching user info:', error.message || error);
        return null;
    }
}
export async function getEarnings(token, proxy) {
    const agent = newAgent(proxy);
    try {
        const response = await axios.get('https://api.depined.org/api/stats/epoch-earnings', {
            headers: {
                ...headers,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });

        return response.data;
    } catch (error) {
        log.error('Error fetching user info:', error.message || error);
        return null;
    }
}
export async function connect(token, proxy) {
    const agent = newAgent(proxy);
    try {
        const payload = { connected: true }
        const response = await axios.post('https://api.depined.org/api/user/widget-connect', payload, {
            headers: {
                ...headers,
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent,
            httpAgent: agent
        });

        return response.data;
    } catch (error) {
        log.error(`Error when update connection: ${error.message}`);
        return null;
    }
}