#!/usr/bin/env node

import * as p from '@clack/prompts'
import { setTimeout } from 'node:timers/promises'
import pc from 'picocolors'
import { exec, spawn } from 'node:child_process'
import * as mysql from 'mysql2'
import { exit } from 'node:process'

function wpDownload(folderName) {
    console.log('Downloading...')

    return new Promise(resolve => {
        exec(`wp core download --path=${folderName}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`${stdout}`);

            return resolve()
        }); 
    });
}

function wpConfig(dbName, folderName) {
    console.log('Config...')

    return new Promise(resolve => {

        exec(`cd ${folderName} && wp config create --dbname=${dbName} --dbuser=root --dbhost=127.0.0.1 --extra-php <<PHP
define( 'WP_DEBUG', true ); 
define( 'WP_DEBUG_LOG', true );`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`${stdout}`);

            return resolve()
        })
    });
}

function wpInstall(folderName, siteTitle) {
    console.log('Installing...')

    return new Promise(resolve => {
        exec(`cd ${folderName} && wp core install --url=https://${folderName}.test --title="${siteTitle}" --admin_user=admin --admin_password=admin --admin_email=admin@email.com`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            return resolve()
        })
    });
    
}

function createDB(dbName) {
    return new Promise(resolve => {
        const con = mysql.createConnection({
            host: "127.0.0.1",
            user: "root",
            password: ""
          });
    
        con.connect(err => {
            if (err) throw err;
            con.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, function (err, result) {
                if (err) throw err;
            });
        })

        return resolve()
    });
}

function folderToTitle(folderName) {
    const words = folderName.replace(/-/g, ' ').replace(/_/g, ' ').split(' ');

    return words.map((word) => { 
        return word[0].toUpperCase() + word.substring(1); 
    }).join(" ");
}

function clearPlugins(folderName) {
    return new Promise(resolve => {
        exec(`cd ${folderName} && wp plugin delete --all`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`${stdout}`);

            return resolve()
        })
    })
}

function secureSite(folderName) {
    return new Promise(resolve => {
        exec(`cd ${folderName} && herd secure`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`${stdout}`);

            return resolve()
        })
    })
}

async function main() {
	console.clear();

    p.intro(`${pc.bgMagenta(pc.black(' WP Cli - Site Installer '))}`)

    const folderName = (await p.text({
        message: "Folder name:",
        placeholder: 'My Blog Name',
        validate(value) {
            if (value.length === 0) return `Value is required!`;
          },
    })).toLowerCase().replace(/ /g, '-')

    const siteTitle = await p.text({
        message: "Site title:",
        initialValue: folderToTitle(folderName)
    })

    const dbName = await p.text({
        message: "Database name:",
        initialValue: folderName.replace(/-/g, '_')
    })

    await createDB(dbName)

    await wpDownload(folderName)

    await wpConfig(dbName, folderName)

    await wpInstall(folderName, siteTitle)

    await clearPlugins(folderName)

    await secureSite(folderName)

    console.log('Done')

    exit()
}

main().catch(console.error);