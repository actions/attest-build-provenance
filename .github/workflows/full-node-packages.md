
## Overview

- Prepare the Full Node machine.
- Install Heimdall and Bor packages on the Full Node machine.
- Configure the Full node.
- Start the Full node.
- Check node health with the community.

!!!note
    You have to follow the exact outlined sequence of actions, otherwise you will run into issues.


## Install packages

#### Prerequisites

- One machine is needed.
- Bash is installed on the machine.

#### Heimdall

- Install the default latest version of sentry for Mainnet:

    ```shell
    curl -L https://raw.githubusercontent.com/maticnetwork/install/main/heimdall.sh | bash
    ```

    or install a specific version, node type (`sentry` or `validator`), and network (`mainnet` or `mumbai`). All release versions can be found on
    [Heimdall GitHub repository](https://github.com/maticnetwork/heimdall/releases).

    ```shell
    curl -L https://raw.githubusercontent.com/maticnetwork/install/main/heimdall.sh | bash -s -- <version> <network> <node_type>
    # Example:
    # curl -L https://raw.githubusercontent.com/maticnetwork/install/main/heimdall.sh | bash -s -- v1.0.3 mainnet sentry
    ```

#### Bor

- Install the default latest version of sentry for Mainnet:

    ```shell
    curl -L https://raw.githubusercontent.com/maticnetwork/install/main/bor.sh | bash
    ```

    or install a specific version, node type (`sentry` or `validator`), and network (`mainnet` or `mumbai`). All release versions could be found on
    [Bor Github repository](https://github.com/maticnetwork/bor/releases).

    ```shell
    curl -L https://raw.githubusercontent.com/maticnetwork/install/main/bor.sh | bash -s -- <version> <network> <node_type>

    # Example:
    # curl -L https://raw.githubusercontent.com/maticnetwork/install/main/bor.sh | bash -s -- v1.1.0
    
    
    mainnet sentry
    ```


## Configuration

In this section, we will go through steps to initialize and customize configurations nodes.

!!!caution
    
    Bor and Heimdall 0.3.0 use standardized paths for configuration files and chain data. If you have existing config files and chain data on your node, please skip the [Configure Heimdall](#configure-heimdall) section below and jump directly to **[Migration](#upgrade-from-02x-to-03x) section** to learn about migrating configs and data to standardized file locations.


### Configure Heimdall

- Initialize Heimdall configs

```shell
# For mainnet
sudo -u heimdall heimdalld init --chain=mainnet --home /var/lib/heimdall

# For testnet
sudo -u heimdall heimdalld init --chain=mumbai --home /var/lib/heimdall
```

- You will need to add a few details in the `config.toml` file. To open the `config.toml` file run the following command `vi /var/lib/heimdall/config/config.toml`

    - Now in the config file you will have to change `Moniker`

    ```shell
    moniker=<enter unique identifier> For example, moniker=my-sentry-node
    ```

    - Change the value of **Prometheus** to `true`
    - Set the `max_open_connections` value to `100`

    Make sure you keep the proper formatting when you make the changes above.

### Configure service files for bor and heimdall

After successfully installing Bor and Heimdall through [packages](#install-packages), their service file could be found under `/lib/systemd/system`, and Bor's config
file could be found under `/var/lib/bor/config.toml`.
You will need to check and modify these files accordingly.

- Make sure the chain is set correctly in `/lib/systemd/system/heimdalld.service` file. Open the file with following command `sudo vi /lib/systemd/system/heimdalld.service`

    - In the service file, set `--chain` to `mainnet` or `mumbai` accordingly

  Save the changes in `/lib/systemd/system/heimdalld.service`.

- Make sure the chain is set correctly in `/var/lib/bor/config.toml` file. Open the file with following command `sudo vi /var/lib/bor/config.toml`

    - In the config file, set `chain` to `mainnet` or `mumbai` accordingly.

    - To enable Archive mode you can optionally enable the following flags:

      ```
      gcmode "archive"

      [jsonrpc]
        [jsonrpc.ws]
          enabled = true
          port = 8546
          corsdomain = ["*"]
      ```

  Save the changes in `/var/lib/bor/config.toml`.


## Start services

Reloading service files to make sure all changes to service files are loaded correctly.

```shell
sudo systemctl daemon-reload
```

Start Heimdall, Heimdall rest server, and Heimdall bridge.

```shell
sudo service heimdalld start
```

You can also check Heimdall logs with command

```shell
journalctl -u heimdalld.service -f
```

Now you need to make sure that **Heimdall is synced** completely and only then Start Bor. If you start Bor without Heimdall syncing completely, you will run into issues frequently.

- To check if Heimdall is synced
    - On the remote machine/VM, run `curl localhost:26657/status`
    - In the output, `catching_up` value should be `false`

Now once Heimdall is synced, run

```shell
sudo service bor start
```

You can check Bor logs via command

```shell
journalctl -u bor.service -f
```
