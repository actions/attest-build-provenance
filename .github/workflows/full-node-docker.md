
The Polygon team distributes official Docker images which can be used to run nodes on the Polygon Mainnet. These instructions are for running a Full Node, but they can be adapted for running sentry nodes and validators as well.

## Prerequisites

The general configuration for running a Polygon full node is to have **at least** 4 CPUs/cores and 16 GB of RAM. For this walk through, we’re going to be using AWS and a `t3.2xlarge` instance type. The application can run on both x86 and ARM architectures.

These instructions are based on Docker, so it should be easy to follow along with almost any operating system, but we’re using Ubuntu.

In terms of space, for a full node you’ll probably need from **2.5 to 5 terabytes of SSD (or faster) storage**.

The peer exchange for a Polygon full node generally depends on port 30303 and 26656 being open. When you configure your firewall or security groups for AWS, make sure these ports are open along with whatever ports you need to access the machine.

TLDR:

- Use a machine with at least 4 cores and 16GB RAM
- Make sure you have from 2.5 TB to 5 TB of fast storage
- Use a public IP and open ports 30303 and 26656

## Initial Setup
At this point, you should have shell access with root privileges to a linux machine.

![img](../../../img/pos/term-access.png)

### Install Docker
Most likely your operating system won’t have Docker installed by default. Please follow the instructions for your particular distribution found here: https://docs.docker.com/engine/install/

We’re following the instructions for Ubuntu. The steps are included below, but please see the official instructions in case they’ve been updated.

``` bash
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

At this point you should have Docker installed. In order to verify, you should be able to run a command like this:

``` bash
sudo docker run hello-world
```

![img](../../../img/pos/hello-world.png)

In many cases, it’s inconvenient to run docker as `root` user so we’ll follow the post install steps [here](https://docs.docker.com/engine/install/linux-postinstall/) in order to interact with docker without needing to be `root`:

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

Now you should be able to logout and log back in and run docker commands without `sudo`.

### Disk Setup
The exact steps required here are going to vary a lot based on your needs. Most likely you’ll have a root partition running your operating system on one device. You’ll probably want one or more devices for actually holding the blockchain data. For the rest of the walkthrough, we’re going to have that additional device mounted at `/mnt/data`.

In this example, we have a device with 4 TB of available space located at `/dev/nvme1n1`. We are going to mount that using the steps below:

```bash
sudo mkdir /mnt/data
sudo mount /dev/nvme1n1 /mnt/data
```

We use `df -h` to make sure the mount looks good.

![img](../../../img/pos/space.png)

If that all looks good, we might as well create the home directories on this mount for Bor and Heimdall.

```bash
sudo mkdir /mnt/data/bor
sudo mkdir /mnt/data/heimdall
```

Depending on your use case and operating system, you’ll likely want to create an entry in `/etc/fstab` in order to make sure your device is mounted when the system reboots.

In our case we're following some steps like this:

```bash
# Use blkid to get the UUID for the device that we're mounting
blkid

# Edit the fstab file  and add a line to mount your device
# UUID={your uuid}		/mnt/data	{your filesystem}	defaults	0	1
sudo emacs /etc/fstab

# use this to verify the fstab actually works
sudo findmnt --verify --verbose
```

At this point you should be able to reboot and confirm that the system loads your mount properly.

### Heimdall Setup

At this point, we have a host with docker running on it and we have ample mounted storage to run our Polygon node software. So let’s get Heimdall configured and running.

First let’s make sure we can run Heimdall with docker. Run the following command:

```bash
docker run -it 0xpolygon/heimdall:1.0.3 heimdallcli version
```

If this is the first time you’ve run Heimdall with docker, it should pull the required image automatically and output the version information.

![img](../../../img/pos/heimdall-version.png)

If you’d like to check the details of the Heimdall image or find a different tag, you can take a look at the repository on Docker Hub: https://hub.docker.com/repository/docker/0xpolygon/heimdall

At this point, let’s run the Heimdall `init` command to set up our home directory.

```bash
docker run -v /mnt/data/heimdall:/heimdall-home:rw --entrypoint /usr/bin/heimdalld -it 0xpolygon/heimdall:1.0.3 init --home=/heimdall-home
```

Let’s break this command down a bit in case anything goes wrong.

* We’re using `docker run` to run a command via docker.

* The switch `-v /mnt/data/heimdall:/heimdall-home:rw` is very important. It’s mounting the folder that we created earlier `/mnt/data/heimdall` from our host system to `/heimdall-home` within the container as a docker volume.

* The `rw` allows the command to write to this docker volume. For all intents and purposes, from within the docker container, the home directory for Heimdall will be `/heimdall-home`.

* The argument `--entrypoint /usr/bin/heimdalld` is overriding the default entry point for this container.

* The switch `-it` is used to run the command interactively.

* Finally we’re specifying which image we want to run with `0xpolygon/heimdall:1.0.3`.

* After that `init --home=/heimdall-home` are arguments being passed to the heimdalld executable. `init` is the command we want to run and `--home` is used to specify the location of the home directory.

After running the `init` command, your `/mnt/data/heimdall` directory should have some structure and look like this:

![img](../../../img/pos/heimdall-tree.png)

Now we need to make a few updates before starting Heimdall. First we’re going to edit the `config.toml` file.

```bash
# Open the config.toml and and make three edits
# moniker = "YOUR NODE NAME HERE"
# laddr = "tcp://0.0.0.0:26657"
# seeds = "LATEST LIST OF SEEDS"

sudo emacs /mnt/data/heimdall/config/config.toml
```

If you don’t have a list of seeds, you can find one [in this section](#seed-nodes-and-bootnodes). In our case, our file has these three lines:

```
# A custom human readable name for this node
moniker="examplenode01"

# TCP or UNIX socket address for the RPC server to listen on
laddr = "tcp://0.0.0.0:26657"

# Comma separated list of seed nodes to connect to
seeds="f4f605d60b8ffaaf15240564e58a81103510631c@159.203.9.164:26656,4fb1bc820088764a564d4f66bba1963d47d82329@44.232.55.71:26656,2eadba4be3ce47ac8db0a3538cb923b57b41c927@35.199.4.13:26656,3b23b20017a6f348d329c102ddc0088f0a10a444@35.221.13.28:26656,25f5f65a09c56e9f1d2d90618aa70cd358aa68da@35.230.116.151:26656"
```

!!!caution
    
    There are two `laddr` inside `config.toml` file. Make sure that you only change the `laddr` parameter under `[rpc]` section.

Now that your `config.toml` file is all set, you’ll need to make two small changes to your `heimdall-config.toml` file. Use your favorite editor to update these two settings:

```
# RPC endpoint for ethereum chain
eth_rpc_url = "http://localhost:9545"

# RPC endpoint for bor chain
bor_rpc_url = "http://localhost:8545"
```

The `eth_rpc_url` should be updated to whatever URL you use for Ethereum Mainnet RPC. The `bor_rpc_url` in our case is going to be updated to `http://bor:8545`. After making the edits, our file has these lines:

```
# RPC endpoint for ethereum chain
eth_rpc_url = "https://eth-mainnet.g.alchemy.com/v2/ydmGjsREDACTED_DONT_USE9t7FSf"

# RPC endpoint for bor chain
bor_rpc_url = "http://bor:8545"
```

The default `init` command provides a `genesis.json` but that will not work with Polygon Mainnet or Mumbai. If you’re setting up a mainnet node, you can run this command to download the correct genesis file:

```bash
sudo curl -o /mnt/data/heimdall/config/genesis.json https://raw.githubusercontent.com/maticnetwork/heimdall/master/builder/files/genesis-mainnet-v1.json
```

If you want to verify that you have the right file, you can check against this hash:

```
# sha256sum genesis.json
498669113c72864002c101f65cd30b9d6b159ea2ed4de24169f1c6de5bcccf14  genesis.json
```

## Starting Heimdall
Before we start Heimdall, we’re going to create a docker network so that the containers can easily network with each other based on names. In order to create the network, run the following command:

```bash
docker network create polygon
```

Now we’re going to start Heimdall. Run the following command:

```bash
docker run -p 26657:26657 -p 26656:26656 -v /mnt/data/heimdall:/heimdall-home:rw --net polygon --name heimdall --entrypoint /usr/bin/heimdalld -d --restart unless-stopped  0xpolygon/heimdall:1.0.3 start --home=/heimdall-home
```

Many of the pieces of this command will look familiar. So let’s talk about what’s new.

* The `-p 26657:26657` and `-p 26656:26656` switches are port mappings. This will instruct docker to map the host port `26657` to the container port `26657` and the same for `26656`.

* The `--net polygon` switch is telling docker to run this container in the polygon network.

* `--name heimdall` is naming the container which is useful for debugging, but it’s all the name that will be used for other containers to connect to Heimdall.

* The `-d` argument tells docker to run this container in the background.

* The switch `--restart unless-stopped` tells docker to automatically restart the container unless it was stopped manually.

* Finally, `start` is being used to actually run the application instead of `init` which just set up the home directory.

At this point it’s helpful to check and see what’s going on. These two commands can be useful:

```bash
# ps will list the running docker processes. At this point you should see one container running
docker ps

# This command will print out the logs directly from the heimdall application
docker logs -ft heimdall
```

At this point, Heimdall should start syncing. When you look at the logs, you should see a log of information being spit out that looks like this:

```
2022-12-14T19:43:23.687640820Z INFO [2022-12-14|19:43:23.687] Executed block                               module=state height=26079 validTxs=0 invalidTxs=0
2022-12-14T19:43:23.721220869Z INFO [2022-12-14|19:43:23.721] Committed state                              module=state height=26079 txs=0 appHash=CAEC4C181C9F82D7F55C4BB8A7F564D69A41295A3B62DDAA45F2BB41333DC20F
2022-12-14T19:43:23.730533414Z INFO [2022-12-14|19:43:23.730] Executed block                               module=state height=26080 validTxs=0 invalidTxs=0
2022-12-14T19:43:23.756646938Z INFO [2022-12-14|19:43:23.756] Committed state                              module=state height=26080 txs=0 appHash=CAEC4C181C9F82D7F55C4BB8A7F564D69A41295A3B62DDAA45F2BB41333DC20F
2022-12-14T19:43:23.768129711Z INFO [2022-12-14|19:43:23.767] Executed block                               module=state height=26081 validTxs=0 invalidTxs=0
2022-12-14T19:43:23.794323918Z INFO [2022-12-14|19:43:23.794] Committed state                              module=state height=26081 txs=0 appHash=CAEC4C181C9F82D7F55C4BB8A7F564D69A41295A3B62DDAA45F2BB41333DC20F
2022-12-14T19:43:23.802989809Z INFO [2022-12-14|19:43:23.802] Executed block                               module=state height=26082 validTxs=0 invalidTxs=0
2022-12-14T19:43:23.830960386Z INFO [2022-12-14|19:43:23.830] Committed state                              module=state height=26082 txs=0 appHash=CAEC4C181C9F82D7F55C4BB8A7F564D69A41295A3B62DDAA45F2BB41333DC20F
2022-12-14T19:43:23.840941976Z INFO [2022-12-14|19:43:23.840] Executed block                               module=state height=26083 validTxs=0 invalidTxs=0
2022-12-14T19:43:23.866564767Z INFO [2022-12-14|19:43:23.866] Committed state                              module=state height=26083 txs=0 appHash=CAEC4C181C9F82D7F55C4BB8A7F564D69A41295A3B62DDAA45F2BB41333DC20F
2022-12-14T19:43:23.875395744Z INFO [2022-12-14|19:43:23.875] Executed block                               module=state height=26084 validTxs=0 invalidTxs=0
```

If you’re not seeing any information like this, your node might not be finding enough peers. The other useful command at this point is an RPC call to check the status of Heimdall syncing:

```bash
curl localhost:26657/status
```

This will return a response like:

```json
{
  "jsonrpc": "2.0",
  "id": "",
  "result": {
    "node_info": {
      "protocol_version": {
        "p2p": "7",
        "block": "10",
        "app": "0"
      },
      "id": "0698e2f205de0ffbe4ca215e19b2ee7275d2c334",
      "listen_addr": "tcp://0.0.0.0:26656",
      "network": "heimdall-137",
      "version": "0.32.7",
      "channels": "4020212223303800",
      "moniker": "examplenode01",
      "other": {
        "tx_index": "on",
        "rpc_address": "tcp://0.0.0.0:26657"
      }
    },
    "sync_info": {
      "latest_block_hash": "812700055F33B175CF90C870B740D01B0C5B5DCB8D22376D2954E1859AF30458",
      "latest_app_hash": "83A1568E85A1D942D37FE5415F3FB3CBD9DFD846A42CBC247DFD6ABB9CE7E606",
      "latest_block_height": "16130",
      "latest_block_time": "2020-05-31T17:06:31.350723885Z",
      "catching_up": true
    },
    "validator_info": {
      "address": "3C6058AF387BB74D574582C2BEEF377E7A4C0238",
      "pub_key": {
        "type": "tendermint/PubKeySecp256k1",
        "value": "BOIKA6z1q3l5iSJoaAiagWpwUw3taAhiEMyZ9ffxAMznas2GU1giD5YmtnrB6jzp4kkIqv4tOmuGYILSdy9+wYI="
      },
      "voting_power": "0"
    }
  }
}
```

In this initial setup phase, it’s important to pay attention to the `sync_info` field. If `catching_up` is true, it means that Heimdall is not fully synced. You can check the other properties within `sync_info` to get a sense how far behind Heimdall is.

## Starting Bor

At this point, you should have a node that’s successfully running Heimdall. You should be ready now to run Bor.

Before we get started with Bor, we need to run the Heimdall rest server. This command will start a REST API that Bor uses to retrieve information from Heimdall. The command to start server is:

```bash
docker run -p 1317:1317 -v /mnt/data/heimdall:/heimdall-home:rw --net polygon --name heimdallrest --entrypoint /usr/bin/heimdalld -d --restart unless-stopped 0xpolygon/heimdall:1.0.3 rest-server --home=/heimdall-home --node "tcp://heimdall:26657"
```

There are two pieces of this command that are different and worth noting. Rather than running the `start` command, we’re running the `rest-server` command. Also, we’re passing `~–node “tcp://heimdall:26657”~` which tells the rest server how to communicate with Heimdall.

If this command runs successfully, when you run `docker ps`, you should see two commands containers running now. Additionally, if you run this command you should see some basic output:

```bash
curl localhost:1317/bor/span/1
```

Bor will rely on this interface. So if you don’t see JSON output, there is something wrong!

Now let’s download the `genesis` file for Bor specifically:

```bash
sudo curl -o /mnt/data/bor/genesis.json 'https://raw.githubusercontent.com/maticnetwork/bor/master/builder/files/genesis-mainnet-v1.json'
```

Let’s verify the `sha256 sum` again for this file:

```
# sha256sum genesis.json
4bacbfbe72f0d966412bb2c19b093f34c0a1bd4bb8506629eba1c9ca8c69c778  genesis.json
```

Now we need to create a default config file for starting Bor.

```bash
docker run -it  0xpolygon/bor:1.1.0 dumpconfig | sudo tee /mnt/data/bor/config.toml
```

This command is going to generate a .toml file with default settings. We’re going to make a few changes to the file, so open it up with your favorite editor and make a few updates. Note: we’re only showing the lines that are changed.

For reference, you can see the details for the Bor image here: [https://hub.docker.com/repository/docker/0xpolygon/bor](https://hub.docker.com/repository/docker/0xpolygon/bor)

``` bash
# Similar to moniker, you might want to update this with a name of your own choosing
identity = "docker.example"

# Setting this to the location of a mount that we'll make
datadir = "/bor-home"

# We'll want to specify some boot nodes
[p2p]
  [pep.discovery]
    bootnodes = ["enode://0cb82b395094ee4a2915e9714894627de9ed8498fb881cec6db7c65e8b9a5bd7f2f25cc84e71e89d0947e51c76e85d0847de848c7782b13c0255247a6758178c@44.232.55.71:30303", "enode://88116f4295f5a31538ae409e4d44ad40d22e44ee9342869e7d68bdec55b0f83c1530355ce8b41fbec0928a7d75a5745d528450d30aec92066ab6ba1ee351d710@159.203.9.164:30303"]

# Because we're running inside docker, we'll likely need to change the way we connect to heimdall
[heimdall]
  url = "http://heimdallrest:1317"

# Assuming you want to access the RPC, you'll need to make a change here as well
[jsonrpc]
  [jsonrpc.http]
    enabled = true
    host = "0.0.0.0"
```

At this point, we should be ready to start Bor. We’re going to use this command:
``` bash
docker run -p 30303:30303 -p 8545:8545 -v /mnt/data/bor:/bor-home:rw --net polygon --name bor -d --restart unless-stopped  0xpolygon/bor:1.1.0 server --config /bor-home/config.toml
```

If everything went well, you should see lots of logs that look like this:

```bash
2022-12-14T19:53:51.989897291Z INFO [12-14|19:53:51.989] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:47:46Z
2022-12-14T19:53:51.989925064Z INFO [12-14|19:53:51.989] Fetching state sync events               queryParams="from-id=4&to-time=1590882466&limit=50"
2022-12-14T19:53:51.997640841Z INFO [12-14|19:53:51.997] StateSyncData                            Gas=0       Block-number=12800 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.021990622Z INFO [12-14|19:53:52.021] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:49:58Z
2022-12-14T19:53:52.022015930Z INFO [12-14|19:53:52.021] Fetching state sync events               queryParams="from-id=4&to-time=1590882598&limit=50"
2022-12-14T19:53:52.040660857Z INFO [12-14|19:53:52.040] StateSyncData                            Gas=0       Block-number=12864 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.064795784Z INFO [12-14|19:53:52.064] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:52:10Z
2022-12-14T19:53:52.064828634Z INFO [12-14|19:53:52.064] Fetching state sync events               queryParams="from-id=4&to-time=1590882730&limit=50"
2022-12-14T19:53:52.085029612Z INFO [12-14|19:53:52.084] StateSyncData                            Gas=0       Block-number=12928 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.132067703Z INFO [12-14|19:53:52.131] ✅ Committing new span                    id=3                startBlock=13056 endBlock=19455 validatorBytes=f8b6d906822710940375b2fc7140977c9c76d45421564e354ed42277d9078227109442eefcda06ead475cde3731b8eb138e88cd0bac3d9018238a2945973918275c01f50555d44e92c9d9b353cadad54d905822710947fcd58c2d53d980b247f1612fdba93e9a76193e6d90482271094b702f1c9154ac9c08da247a8e30ee6f2f3373f41d90282271094b8bb158b93c94ed35c1970d610d1e2b34e26652cd90382271094f84c74dea96df0ec22e11e7c33996c73fcc2d822 producerBytes=f8b6d906822710940375b2fc7140977c9c76d45421564e354ed42277d9078227109442eefcda06ead475cde3731b8eb138e88cd0bac3d9018238a2945973918275c01f50555d44e92c9d9b353cadad54d905822710947fcd58c2d53d980b247f1612fdba93e9a76193e6d90482271094b702f1c9154ac9c08da247a8e30ee6f2f3373f41d90282271094b8bb158b93c94ed35c1970d610d1e2b34e26652cd90382271094f84c74dea96df0ec22e11e7c33996c73fcc2d822
2022-12-14T19:53:52.133545235Z INFO [12-14|19:53:52.133] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:54:22Z
2022-12-14T19:53:52.133578948Z INFO [12-14|19:53:52.133] Fetching state sync events               queryParams="from-id=4&to-time=1590882862&limit=50"
2022-12-14T19:53:52.135049605Z INFO [12-14|19:53:52.134] StateSyncData                            Gas=0       Block-number=12992 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.152067646Z INFO [12-14|19:53:52.151] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:56:34Z
2022-12-14T19:53:52.152198357Z INFO [12-14|19:53:52.151] Fetching state sync events               queryParams="from-id=4&to-time=1590882994&limit=50"
2022-12-14T19:53:52.176617455Z INFO [12-14|19:53:52.176] StateSyncData                            Gas=0       Block-number=13056 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.191060112Z INFO [12-14|19:53:52.190] Fetching state updates from Heimdall     fromID=4 to=2020-05-30T23:58:46Z
2022-12-14T19:53:52.191083740Z INFO [12-14|19:53:52.190] Fetching state sync events               queryParams="from-id=4&to-time=1590883126&limit=50"
2022-12-14T19:53:52.223836639Z INFO [12-14|19:53:52.223] StateSyncData                            Gas=0       Block-number=13120 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.236025906Z INFO [12-14|19:53:52.235] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:00:58Z
2022-12-14T19:53:52.236053406Z INFO [12-14|19:53:52.235] Fetching state sync events               queryParams="from-id=4&to-time=1590883258&limit=50"
2022-12-14T19:53:52.269611566Z INFO [12-14|19:53:52.269] StateSyncData                            Gas=0       Block-number=13184 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.283199351Z INFO [12-14|19:53:52.283] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:03:10Z
2022-12-14T19:53:52.283737573Z INFO [12-14|19:53:52.283] Fetching state sync events               queryParams="from-id=4&to-time=1590883390&limit=50"
2022-12-14T19:53:52.314141359Z INFO [12-14|19:53:52.314] StateSyncData                            Gas=0       Block-number=13248 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.325150782Z INFO [12-14|19:53:52.325] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:05:22Z
2022-12-14T19:53:52.325171075Z INFO [12-14|19:53:52.325] Fetching state sync events               queryParams="from-id=4&to-time=1590883522&limit=50"
2022-12-14T19:53:52.354470271Z INFO [12-14|19:53:52.354] StateSyncData                            Gas=0       Block-number=13312 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.372354857Z INFO [12-14|19:53:52.372] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:07:34Z
2022-12-14T19:53:52.372389214Z INFO [12-14|19:53:52.372] Fetching state sync events               queryParams="from-id=4&to-time=1590883654&limit=50"
2022-12-14T19:53:52.398246950Z INFO [12-14|19:53:52.398] StateSyncData                            Gas=0       Block-number=13376 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.413321099Z INFO [12-14|19:53:52.413] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:09:46Z
2022-12-14T19:53:52.413345355Z INFO [12-14|19:53:52.413] Fetching state sync events               queryParams="from-id=4&to-time=1590883786&limit=50"
2022-12-14T19:53:52.437176855Z INFO [12-14|19:53:52.437] StateSyncData                            Gas=0       Block-number=13440 LastStateID=3 TotalRecords=0
2022-12-14T19:53:52.450356966Z INFO [12-14|19:53:52.450] Fetching state updates from Heimdall     fromID=4 to=2020-05-31T00:11:58Z
```

There are a few ways to check the sync state of Bor. The simplest is with `curl`:

```bash
curl 'localhost:8545/' \
--header 'Content-Type: application/json' \
-d '{
	"jsonrpc":"2.0",
	"method":"eth_syncing",
	"params":[],
	"id":1
}'
```

When you run this command, it will give you a result like:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "currentBlock": "0x2eebf",
    "healedBytecodeBytes": "0x0",
    "healedBytecodes": "0x0",
    "healedTrienodeBytes": "0x0",
    "healedTrienodes": "0x0",
    "healingBytecode": "0x0",
    "healingTrienodes": "0x0",
    "highestBlock": "0x1d4ee3e",
    "startingBlock": "0x0",
    "syncedAccountBytes": "0x0",
    "syncedAccounts": "0x0",
    "syncedBytecodeBytes": "0x0",
    "syncedBytecodes": "0x0",
    "syncedStorage": "0x0",
    "syncedStorageBytes": "0x0"
  }
}
```

This will indicate the `currentBlock` that’s been synced and also the `highestBlock` that we’re aware of. If the node is already synced, we should get `false`.

## Seed nodes and bootnodes

- Heimdall seed nodes:

  ```bash
  moniker=<enter unique identifier>

  # Mainnet:
  seeds="1500161dd491b67fb1ac81868952be49e2509c9f@52.78.36.216:26656,dd4a3f1750af5765266231b9d8ac764599921736@3.36.224.80:26656,8ea4f592ad6cc38d7532aff418d1fb97052463af@34.240.245.39:26656,e772e1fb8c3492a9570a377a5eafdb1dc53cd778@54.194.245.5:26656,6726b826df45ac8e9afb4bdb2469c7771bd797f1@52.209.21.164:26656"

  # Testnet:
  seeds="9df7ae4bf9b996c0e3436ed4cd3050dbc5742a28@43.200.206.40:26656,d9275750bc877b0276c374307f0fd7eae1d71e35@54.216.248.9:26656,1a3258eb2b69b235d4749cf9266a94567d6c0199@52.214.83.78:26656"
  ```

!!! tip
    The following Heimdall seed can be used for both mainnet and Mumbai testnet: `8542cd7e6bf9d260fef543bc49e59be5a3fa9074@seed.publicnode.com:27656`

- Bootnodes:

  ```bash
  # Mainnet:
  bootnode ["enode://b8f1cc9c5d4403703fbf377116469667d2b1823c0daf16b7250aa576bacf399e42c3930ccfcb02c5df6879565a2b8931335565f0e8d3f8e72385ecf4a4bf160a@3.36.224.80:30303", "enode://8729e0c825f3d9cad382555f3e46dcff21af323e89025a0e6312df541f4a9e73abfa562d64906f5e59c51fe6f0501b3e61b07979606c56329c020ed739910759@54.194.245.5:30303"]

  # Testnet:
  bootnodes ["enode://bdcd4786a616a853b8a041f53496d853c68d99d54ff305615cd91c03cd56895e0a7f6e9f35dbf89131044e2114a9a782b792b5661e3aff07faf125a98606a071@43.200.206.40:30303", "enode://209aaf7ed549cf4a5700fd833da25413f80a1248bd3aa7fe2a87203e3f7b236dd729579e5c8df61c97bf508281bae4969d6de76a7393bcbd04a0af70270333b3@54.216.248.9:30303"]
  ```
