import { saveToFile, delay, readFile, saveToFileFully } from './utils/helper.js';
import log from './utils/logger.js'
import Mailjs from '@cemalgnlts/mailjs';
import banner from './utils/banner.js';

import {
    registerUser,
    createUserProfile,
    confirmUserReff,
    getUserRef,
    loginUser
} from './utils/api.js'
const mailjs = new Mailjs();

const main = async () => {
    log.info(banner);
    log.info(`proccesing run auto register (CTRL + C to exit)`);
    await delay(3);

    const existingAccounts = await readFile("full.csv")
    const newAccounts = await readFile("register.csv")

    for (const [index, existingAccount] of existingAccounts.entries()) {
        const [existingEmail,, existingProxy, existingToken] = existingAccount.split(',');
        log.info(`Try to get referral code for account: ${index+1} ${existingEmail} `);
        const reffResp = await getUserRef(existingToken, existingProxy);
        if (!reffResp?.data?.is_referral_active) {
            log.warn(`Referral not active: ${existingEmail}`);
            continue;
        }
        let reffCode = reffResp?.data?.referral_code;
        while (reffCode) {
            log.info(`Found new active referral code: ${reffCode}`);
            try {
                let [email, password, proxy] = newAccounts[0].split(',');
                let token = null;
                log.info(`Trying to register email: ${email}`);
                let regResp = await registerUser(email, password, proxy);
                if (regResp?.error === 'email already registered') {
                    log.info(`Account ${email} already registered`);
                    const loginResp = await loginUser(email, password, proxy);
                    if (loginResp?.data?.has_entered_referral_code) {
                        log.info(`Account ${email} already has a referral code`);
                        token = loginResp.data.token;
                        await saveToFile("tokens.txt", token);
                        await saveToFile("proxy.txt", proxy);
                        await saveToFile("full.csv", `${email},${password},${proxy},${token}`);
                        continue
                    }
    
                    log.info(`Account ${email} already registered but not has a referral code`);
                    token = loginResp.data.token;
                }
                else if (!regResp?.data?.token) {
                    log.error(`Failed to register account ${email}`);
                    continue;
                }
                else {
                    token = regResp.data.token;
                    log.info(`Trying to create profile for ${email}`);
                    await createUserProfile(token, { step: 'username', username: email.split('@')[0] }, proxy);
                    await createUserProfile(token, { step: 'description', description: "AI Startup" }, proxy);
                }

                let confirmResp = await confirmUserReff(token, reffCode, proxy);

                if (!confirmResp?.data?.token) {
                    log.error(`Failed to confirm referral for account ${email}`);
                    continue;
                }

                await saveToFile("tokens.txt", `${confirmResp.data.token}`)
                await saveToFile("proxy.txt", proxy);
                await saveToFile("full.csv", `${email},${password},${proxy},${confirmResp.data.token}`)

                newAccounts.shift();

                await delay(5);
                const reffResp = await getUserRef(existingToken, existingProxy);
                if (!reffResp?.data?.is_referral_active) {
                    log.warn(`Referral not active for account: ${existingEmail}`);
                    reffCode = null;
                }
                reffCode = reffResp?.data?.referral_code;
            } catch (err) {
                log.error('Error creating account:', err.message);
            }
        }

        log.info(`No more referral code found for account: ${existingEmail}`);
    }

    await saveToFileFully("register.csv", newAccounts.join('\n'));
};

// Handle CTRL+C (SIGINT)
process.on('SIGINT', () => {
    log.warn('SIGINT received. Exiting...');
    process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log.error('Uncaught exception:', err);
    process.exit(1);
});

main();
