## Using the IntelliJ sample bundle

The IntelliJ example bundle in `samples/intellij` Shows how to connect to a JetBrains IDE and print all installed plugins. Here is a guide to how to get it working:

1. clone [this](https://github.com/noeppi-noeppi/nodecg-io-intellij) Git Repository

2. Make sure you've Java 11 or newer installed.

3. Run `gradlew build` (on windows) or `./gradlew build` (on linux) inside the cloned repository.

4. Inside your JetBrains IDE go to `Settings` and then `Plugins`. Click on the little gear in the top right corner. Then click `Install from file`.

5. Navigate to `path to your cloned repository/build/libs` and select the jar file there.

6. Restart the IDE

7. Start nodecg with nodecg-io installed. The bundle is currently part of it so it should also be loaded.

8. Go to the `nodecg-io` tab in the nodecg dashboard.

9. Login using your password. If this is your first run, then enter the password with which you want to encrypt your configurations and credentials.

10. Create a new intellij service instance using the left upper menu.

11. Enter the following

    ```
    {
        "address": "127.0.0.1:19524"
    }
    ```

    This tells nodecg-io to look for your IDE's HTTP server on your computer at port `19524`. If you want it to run on another port please follow the guidelines [here](https://github.com/noeppi-noeppi/nodecg-io-intellij/blob/master/README.md)

12. Set the created intellij service instance to the service dependency of the sample-intellij bundle.

    Select the sample-intellij bundle and the intellij service in the left bottom menu and then select the service instance that should be used by the sample-intellij bundle (in this case the name of the previously created intellij instance).

13. Check the nodecg logs

    You should see an error or a list of all plugins installed at your IDE including the preinstalled ones by JetBrains.
