
This deployment guide walks you through starting and running a full node through various methods. For the system requirements, see the [Minimum Technical Requirements](../validator/validator-system-requirements.md) guide.

!!!tip "Snapshots"
    
    Steps in these guide involve waiting for the Heimdall and Bor services to fully sync. This process takes several days to complete.

    Please use snapshots for faster syncing without having to sync over the network. For detailed instructions, see [<ins>Sync node using snapshots</ins>](../../how-to/snapshots.md).

    For snapshot download links, see the [<ins>Polygon Chains Snapshots</ins>](https://snapshots.polygon.technology/) page.


## Overview

- Prepare the machine
- Install Heimdall and Bor binaries on the full node machine
- Set up Heimdall and Bor services on the full node machine
- Configure the full node machine
- Start the full node machine
- Check node health with the community

!!!note
    
    You have to follow the exact outlined sequence of actions, otherwise you will run into issues.


### Install `build-essential`

This is **required** for your full node. In order to install, run the below command:

```bash
sudo apt-get update
sudo apt-get install build-essential
```

## Install binaries

Polygon node consists of 2 layers: Heimdall and Bor. Heimdall is a tendermint fork that monitors contracts in parallel with the Ethereum network. Bor is basically a Geth fork that generates blocks shuffled by Heimdall nodes.

Both binaries must be installed and run in the correct order to function properly.

### Heimdall

Install the latest version of Heimdall and related services. Make sure you checkout to the correct [release version](https://github.com/maticnetwork/heimdall/releases). Note that the latest version, [Heimdall v1.0.5](https://github.com/maticnetwork/heimdall/releases/tag/v1.0.5), contains enhancements such as:

1. Restricting data size in state sync txs to:
    * **30Kb** when represented in **bytes**
    * **60Kb** when represented as **string**

2. Increasing the **delay time** between the contract events of different validators to ensure that the mempool doesn't get filled very quickly in case of a burst of events which can hamper the progress of the chain.

The following example shows how the data size is restricted:

```
Data - "abcd1234"
Length in string format - 8
Hex Byte representation - [171 205 18 52]
Length in byte format - 4
```

To install **Heimdall**, run the below commands:

```bash
curl -L https://raw.githubusercontent.com/maticnetwork/install/main/heimdall.sh | bash -s -- <heimdall_version> <network_type> <node_type>
```

**heimdall_version**: `valid v1.0+ release tag from https://github.com/maticnetwork/heimdall/releases`
**network_type**: `mainnet` and `mumbai`
**node_type**: `sentry`

That will install the `heimdalld` and `heimdallcli` binaries. Verify the installation by checking the Heimdall version on your machine:

```bash
heimdalld version --long
```

### Configure Heimdall seeds (Mainnet)

```bash
sed -i 's|^seeds =.*|seeds = "1500161dd491b67fb1ac81868952be49e2509c9f@52.78.36.216:26656,dd4a3f1750af5765266231b9d8ac764599921736@3.36.224.80:26656,8ea4f592ad6cc38d7532aff418d1fb97052463af@34.240.245.39:26656,e772e1fb8c3492a9570a377a5eafdb1dc53cd778@54.194.245.5:26656,6726b826df45ac8e9afb4bdb2469c7771bd797f1@52.209.21.164:26656"|g' /var/lib/heimdall/config/config.toml
chown heimdall /var/lib/heimdall
```

### Configure Heimdall seeds (Mumbai)

```bash
sed -i 's|^seeds =.*|seeds = "9df7ae4bf9b996c0e3436ed4cd3050dbc5742a28@43.200.206.40:26656,d9275750bc877b0276c374307f0fd7eae1d71e35@54.216.248.9:26656,1a3258eb2b69b235d4749cf9266a94567d6c0199@52.214.83.78:26656"|g' /var/lib/heimdall/config/config.toml
chown heimdall /var/lib/heimdall
```

!!! tip
    The following Heimdall seed can be used for both mainnet and Mumbai testnet: `8542cd7e6bf9d260fef543bc49e59be5a3fa9074@seed.publicnode.com:27656`

### Bor install

Install the latest version of Bor, based on valid v1.0+ [released version](https://github.com/maticnetwork/bor/releases).

```bash
curl -L https://raw.githubusercontent.com/maticnetwork/install/main/bor.sh | bash -s -- <bor_version> <network_type> <node_type>
```

**bor_version**: `valid v1.0+ release tag from https://github.com/maticnetwork/bor/releases`
**network_type**: `mainnet` and `mumbai`
**node_type**: `sentry`

That will install the `bor` binary. Verify the installation by checking the Bor version on your machine:

```bash
bor version
```

### Configure Bor seeds (mainnet)

```bash
sed -i 's|.*\[p2p.discovery\]|  \[p2p.discovery\] |g' /var/lib/bor/config.toml
sed -i 's|.*bootnodes =.*|    bootnodes = ["enode://b8f1cc9c5d4403703fbf377116469667d2b1823c0daf16b7250aa576bacf399e42c3930ccfcb02c5df6879565a2b8931335565f0e8d3f8e72385ecf4a4bf160a@3.36.224.80:30303", "enode://8729e0c825f3d9cad382555f3e46dcff21af323e89025a0e6312df541f4a9e73abfa562d64906f5e59c51fe6f0501b3e61b07979606c56329c020ed739910759@54.194.245.5:30303"]|g' /var/lib/bor/config.toml
chown bor /var/lib/bor
```

### Configure Bor seeds (mumbai)

```bash
sed -i 's|.*\[p2p.discovery\]|  \[p2p.discovery\] |g' /var/lib/bor/config.toml
sed -i 's|.*bootnodes =.*|    bootnodes = ["enode://bdcd4786a616a853b8a041f53496d853c68d99d54ff305615cd91c03cd56895e0a7f6e9f35dbf89131044e2114a9a782b792b5661e3aff07faf125a98606a071@43.200.206.40:30303", "enode://209aaf7ed549cf4a5700fd833da25413f80a1248bd3aa7fe2a87203e3f7b236dd729579e5c8df61c97bf508281bae4969d6de76a7393bcbd04a0af70270333b3@54.216.248.9:30303"]|g' /var/lib/bor/config.toml
chown bor /var/lib/bor
```

### Update service config user permission

```bash
sed -i 's/User=heimdall/User=root/g' /lib/systemd/system/heimdalld.service
sed -i 's/User=bor/User=root/g' /lib/systemd/system/bor.service
```

## Start services

Run the full Heimdall node with these commands on your Sentry Node:

```bash
sudo service heimdalld start
```

Now, you need to make sure that **Heimdall is synced** completely, and then only start Bor. If you start Bor without Heimdall syncing completely, you will run into issues frequently.

**To check if Heimdall is synced**
  1. On the remote machine/VM, run `curl localhost:26657/status`
  2. In the output, `catching_up` value should be `false`

Once Heimdall is synced, run the below command:

```bash
sudo service bor start
```

## Logs

Logs can be managed by the `journalctl` linux tool. Here is a tutorial for advanced usage: [How To Use Journalctl to View and Manipulate Systemd Logs](https://www.digitalocean.com/community/tutorials/how-to-use-journalctl-to-view-and-manipulate-systemd-logs).

**Check Heimdall node logs**

```bash
journalctl -u heimdalld.service -f
```

**Check Heimdall rest-server logs**

```bash
journalctl -u heimdalld-rest-server.service -f
```

**Check Bor rest-server logs**

```bash
journalctl -u bor.service -f
```

## Ports and firewall setup

Open ports 22, 26656 and 30303 to world (0.0.0.0/0) on sentry node firewall.

You can use VPN to restrict access for port 22 as per your requirement and security guidelines.
