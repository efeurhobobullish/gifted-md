const { gmd } = require("../gift");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");

gmd({
    pattern: "update",
    alias: ["updatenow", "updt", "sync", "update now"],
    react: '🆕',
    desc: "Update the bot to the latest version.",
    category: "owner",
    filename: __filename
}, async (from, Gifted, conText) => {
  const { q, mek, react, reply, config, isSuperUser, setCommitHash, getCommitHash } = conText;
    
  if (!isSuperUser) {
    await react("❌");
    return reply("❌ Owner Only Command!");
    }
  
    try {
        await reply("🔍 Checking for New Updates...");

        const { data: commitData } = await axios.get(`https://api.github.com/repos/${config.BOT_REPO}/commits/main`);
        const latestCommitHash = commitData.sha;

        const currentHash = await getCommitHash();

        if (latestCommitHash === currentHash) {
            return reply("✅ Your Bot is Already on the Latest Version!");
        }

        const authorName = commitData.commit.author.name;
        const authorEmail = commitData.commit.author.email;
        const commitDate = new Date(commitData.commit.author.date).toLocaleString();
        const commitMessage = commitData.commit.message;

        await reply(`🔄 Updating Bot...\n\n*Commit Details:*\n👤 Author: ${authorName} (${authorEmail})\n📅 Date: ${commitDate}\n💬 Message: ${commitMessage}`);

        const zipPath = path.join(__dirname, '..', 'gifted-md-main.zip'); // Replace this  with your bot name and branch if you're cloning
        const { data: zipData } = await axios.get(`https://github.com/${config.BOT_REPO}/archive/main.zip`, { responseType: "arraybuffer" });
        fs.writeFileSync(zipPath, zipData);

        const extractPath = path.join(__dirname, '..', 'latest');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const sourcePath = path.join(extractPath, 'gifted-md-main'); // Replace this  with your bot name and branch if you're cloning
        const destinationPath = path.join(__dirname, '..');
        copyFolderSync(sourcePath, destinationPath);
        await setCommitHash(latestCommitHash);

        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply("✅ Update Complete! Bot is Restarting...");
        
        setTimeout(() => {
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error("Update error:", error);
        return reply("❌ Update Failed. Please try Manually by Redeploying.");
    }
});

function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (item === ".env") {
            console.log(`Skipping ${item} to preserve custom settings/vars ie session id.`);
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
