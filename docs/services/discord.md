## Using the Discord sample bundle

The Discord-guild-chat example bundle in `samples/discord-guild-chat` demonstrates the ability ping back messages witch start with `!ping`. Here is a guide to how to get it working.

### Prerequisites

* Working NodeCG & nodecg-oi installation
* a Discord Bot token

*Note:* If you don't have such a token yet you can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html) guide.

### Configure the Discord sample bundle

1. Start nodecg with nodecg-io installed. The Discord-guild-chat bundle is currently part of it so it should also be loaded.

2. Go to the `nodecg-io` tab in the nodecg dashboard.

3. Login using your password. If this is your first run, then enter the password with which you want to encrypt your configurations and credentials.

4. Create a new discord service instance using the left upper menu.

5. Enter your bot token.

   The created instance should be automatically selected, if not select it in the upper left menu. Enter your Bot token in monaco (the texteditor on the right) in this format:

   ```json
   {
       "botToken": "your-token-goes-here"
   }
   ```

   After entering it, click save.

   *Note:* If you don't see monaco on the right, try reloading the page.

6. Set the created discord service instance to the service dependency of the Discord-guild-chat bundle.

   Select the Discord-guild-chat bundle and the Discord service in the left bottom menu and then select the service instance that should be used by the Discord-guild-chat bundle (in this case the name of the previously created discord instance).

7. Check the nodecg logs

   You should see an error or a Login message.