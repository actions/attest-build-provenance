# System requirements

The general configuration for running a Polygon full node is to have **at least** 4 CPUs/cores and 16 GB of RAM.

In terms of space, for a full node you’ll need from **2.5 to 5 terabytes of SSD (or faster) storage**.

# Available ports

The peer exchange for a Polygon full node generally depends on **port 30303 and 26656** being open. When you configure your firewall or security groups for AWS, make sure these ports are open along with whatever ports you need to access the machine.

# TL;DR

|              |  Minimum   | Recommended |
| :----------: | :--------: | :---------: |
|     CPU      |  4 cores   |  16 cores   |
|     RAM      |    32GB    |    64GB     |
|   Storage    |   2.5TB    |     5TB     |
|  Bandwidth   | 100 Mbps+  |   1 Gbps    |
| AWS instance | c5.4xlarge | m5d.4xlarge |