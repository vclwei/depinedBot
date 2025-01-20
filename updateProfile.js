import log from './utils/logger.js'
import { delay, readFile } from './utils/helper.js';

import {
    getUserProfile,
    createUserProfile
} from './utils/api.js'

const main = async () => {
    log.info(`proccesing run auto register (CTRL + C to exit)`);
    await delay(3);

    const accounts = await readFile("full.csv")
    for (const [index, account] of accounts.entries()) {
        const [email, ,proxy, token] = account.split(',');
        log.info(`Updating profile for account ${index + 1}: ${email}`);
        const profile = await getUserProfile(token, proxy);
        log.info(`Profile: ${profile?.username} ${profile?.description}`);
        if (!profile?.username) {
            const username = email.split('@')[0]
            log.info(`Updating profile for account ${index + 1}: ${email} username: ${username}`);
            await createUserProfile(token, { step: 'username', username: username }, proxy);
        }

        if (!profile?.description) {
            const descriptions = ["Rendering", "AI Startup", "CTO", "Other", "C-Level"];
            const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
            log.info(`Updating description for account ${index + 1}: ${email} description: ${randomDescription}`);
            await createUserProfile(token, { step: 'description', description: randomDescription }, proxy);
        }
    }
}

main()