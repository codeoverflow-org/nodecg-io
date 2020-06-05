# nodecg-io

**Development status: framework mostly implemented, no services other than a simple twitch chat**

## Installation

Requirements: [git](https://git-scm.com/), [node](https://nodejs.org), [npm](https://www.npmjs.com/get-npm) and a working [nodecg](https://nodecg.com) installation.

1. Clone this repository: `git clone https://github.com/codeoverflow-org/nodecg-io.git`

   *Note:* you should clone nodecg-io to somewhere outside of your nodecg `bundles/` directory as this repo contains many bundles in subdirectories and nodecg doesn't support nesting of the bundles in other directories. You can clone it to any other path that you wish.

2. Install dependencies: `cd path/to/nodecg-io && npm install`

3. Build nodecg-io: `cd path/to/nodecg-io && npm run build`

4. Add nodecg-io directory to the nodecg config:

   Modify the nodecg configuration in `path/to/nodecg/cfg/nodecg.json`, here is an example config:

   ```json
   {
       "bundles": {
           "paths": ["path/to/nodecg-io"]
       }
   }
   ```

   *Note 1:* This path should point to the root of this repository, not to a bundle inside this repo.
   
   *Note 2:* If nodecg doesn't load nodecg-io for some reason you might want to use an absolute path here.

5. Start nodecg.

## Using the sample bundle

There is a simple example bundle in `sample/` that demonstrates the ability to get access to a twitch chat and printing all messages of it. Here is a guide to how to get it working:

1. Start nodecg with nodecg-io installed. The bundle is currently part of it so it should also be loaded.

2. Go to the `nodecg-io` tab in the nodecg dashboard.

3. Login using your password. If this is your first run, then enter the password with which you want to encrypt your configurations and credentials.

4. Create a new twitch service instance using the left upper menu.

5. Enter credentials for twitch.

   The created instance should be automatically selected, if not select it in the upper left menu.

   Here is a sample config for you to orient:

   ```json
   {
       "oauthKey": "oauth:abcdef...."
   }
   ```

   After entering it, click save.

   *Note:* If you don't see monaco on the right, try reloading the page.

6. Set the created twitch service instance to the service dependency of the sample bundle.

   Select the sample bundle and the twitch service in the left bottom menu and then select the service instance that should be used by the sample bundle (in this case the name of the previously created twitch instance).

7. Check the nodecg logs

   You should see an error or a success message and all twitch messages that are written in the twitch channel that is hardcoded in `sample/extension/index.ts`.

