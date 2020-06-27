## Using the Streamdeck rainbow sample bundle

The streamdeck-rainbow bundle paints your streamdeck with different colors.

Sadly you can't access the streamdeck while another application accesses it. So you need to stop your Streamdeck Software before.

### Configure the Streamdeck Rainbow bundle

1, If you're on linux follow the instructions listed under Manual Installation [here](https://github.com/timothycrosley/streamdeck-ui/blob/master/README.md). Everything after the `sudo udevadm` command can be omitted.

2. Start nodecg with nodecg-io installed. The streamdeck-rainbow bundle is currently part of it so it should also be loaded.

3. Go to the `nodecg-io` tab in the nodecg dashboard.

4. Login using your password. If this is your first run, then enter the password with which you want to encrypt your configurations and credentials.

5. Create a new streamdeck service instance using the left upper menu.

6. Enter the configuration

   ```json
   {
       "device": "default"
   }
   ```
   
   `default` tells the bundle to automatically find a streamdeck. If you've multiple streamdecks you need to put in an id here.

7. Set the created streamdeck service instance to the service dependency of the streamdeck-rainbow bundle.

8. Watch your streamdeck.


Due to issue [#21](https://github.com/codeoverflow-org/nodecg-io/issues/21) you might need to replug your streamdeck when you restart nodecg as the connection is not closed when the program exits.