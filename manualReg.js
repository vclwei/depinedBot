import { readFile, saveToFile } from './utils/helper.js';
import log from './utils/logger.js'
import banner from './utils/banner.js';
import readline from 'readline/promises';
import {
    registerUser,
    loginUser,
    createUserProfile,
    confirmUserReff,
    getIp
} from './utils/api.js'

// Read register info from register.csv [email,password,proxy]
// Save result to full.csv [email,password,proxy,token]
const main = async () => {
    log.info(banner);

    const accounts = await readFile("register.csv");
    if (accounts.length === 0) {
        log.error('No accounts found in register.csv');
        return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    for (const [index, account] of accounts.entries()) {
        try {
            const [email, password, proxy] = account.split(',');
            log.info(`Processing account ${index + 1}: ${email} ${proxy}`);

            const regResponse = await registerUser(email, password, proxy);
            let token = null;
            if (regResponse?.error === 'email already registered') {
                const loginResp = await loginUser(email, password, proxy);
                if (loginResp?.data?.has_entered_referral_code) {
                    log.info(`Account ${email} already has a referral code`);
                    token = loginResp.data.token;
                    await saveToFile("tokens.txt", token);
                    await saveToFile("proxy.txt", proxy);
                    await saveToFile("full.csv", `${email},${password},${proxy},${token}`);
                    continue
                }

                log.error(`Account ${email} already registered but not has a referral code`);
                token = loginResp.data.token;
            }
            else if (!regResponse?.data?.token) {
                log.error(`Failed to register account ${email}`);
                continue;
            }
            else {
                token = regResponse.data.token;

                log.info(`Trying to create profile for ${email}`);
                await createUserProfile(token, { step: 'username', username: email.split('@')[0] }, proxy);
                await createUserProfile(token, { step: 'description', description: "AI Startup" }, proxy);
            }

            let isEntered = false;
            while (!isEntered) {
                const reffCode = await rl.question('Enter Your Referral code or (CTRL + C to exit): ');
                log.info(`Use Referral code: ${reffCode}`);
                const confirm = await confirmUserReff(token, reffCode);
                if (confirm?.data?.token) {
                    log.info('Referral confirmed successfully');
                    await saveToFile("tokens.txt", confirm.data.token);
                    await saveToFile("proxy.txt", proxy);
                    await saveToFile("full.csv", `${email},${password},${proxy},${confirm.data.token}`)
                    isEntered = true;
                }
            }
        } catch (err) {
            log.error('Error creating account:', err.message);
        }
    }
};

// Handle CTRL+C (SIGINT)
process.on('SIGINT', () => {
    log.info('SIGINT received. Exiting...');
    process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log.error('Uncaught exception:', err);
    process.exit(1);
});

main();
