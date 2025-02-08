---
layout: default
title: Installation
permalink: /install/
---

# Install Leetcode Fetcher 🛠️

There are three main methods to install the *Leetcode Fetcher Application*, either cloning the [repository](https://github.com/lmriccardo/leetcode-fetcher), 
or using [Docker containers](https://www.docker.com/resources/what-container/), or installing it from the NPM Repository.

For method (1) and (3) there are two important requirements: [**NodeJS**](https://nodejs.org/en/download) version `>= 22.13.0` 
and [**npm**](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version `>= 11.1.0`.

## 1. Install locally from repo

Using this method, you will clone the entire repository into a new folder called *leetcode-fetcher*. Once entered the folder, you will need to install all the
dependencies using the *npm* command. The result of the previous operation will be a new folder called *node_modules* located at the root of the repository. This
folder will contain all the packages required by the application to work as intended. The following is corresponding list of commands:

```
git clone https://github.com/lmriccardo/leetcode-fetcher.git
cd leetcode-fetcher
npm install
```

Finally, to run the application the command is `npm run app`.

## 2. Using Docker Containers

The second alternative leverages the Docker container toolbox to run a **containerized** leetcode fetcher version. In the repository is also contained
the [*Dockerfile*](https://github.com/lmriccardo/leetcode-fetcher/blob/master/Dockerfile) used to build the image required to create the container. Hence,
if everything is up to date to the last version, you should be able to modify and build the image by your own and start the container. However, it is **highly**
recommended to use the **latest** one in the [*Docker Hub*](https://hub.docker.com/repository/docker/lmriccardo/leetcode-fetcher/general), since it comes with the latest features and bug fixes.

There should be no need but, to use this methodology, *Docker* (or Docker Desktop) must be installed in the system. 

To run the application, the command is:

```
docker run --rm -it -v ./:/leetcode lmriccardo/leetcode-fetcher:latest
```

This will start a new container in *interactive* (`-i`) mode with an active *terminal session* (`-t`) based on the provided Docker Image. The `--rm` option is
useful to entirely remove the container once the application stops. Please notice that the `-v` option is not optional at all, **it must be used as previously shown** otherwise the application might not work well. This option creates a [*bind mount*](https://docs.docker.com/engine/storage/bind-mounts/) from the current
working folder on the host to the `/leetcode` folder in the container. It is important that the target folder remains `/leetcode` since it is the working directory,
and so the entry point, of the user inside the container. This mount is required so that all problem instances that will be created inside the container will persist
in the current folder (on the host machine), instead of being removed once the container stops.

These are the three most important **DO NOT** points:

- Do not remove the `-it` option
- Do not remove the `-v` option
- Do not change the target folder for the `-v` option

## 3. From NPM Repository

The last alternative involves installing the application directly from the [*npm page*](https://www.npmjs.com/package/leetcode-fetcher-cli).

```bash
# Globally on the system
npm install leetcode-fetcher-cli

# Locally, in the current folder
npm install -D leetcode-fetcher-cli
```

In case the second option is picked, it will results in two files names: `package.json` and `package-lock.json`, and in a folder named `node_modules`. For Mac
or Linux users the binary file is located at `./node_modules/.bin/lcfetcher`, while for Windows user at `./node_modules/.bin/lcfetcher.cmd` (for old-style
Windows CMD) or `./node_modules/.bin/lcfetcher.ps1` (is using PowerShell or Windows Terminal). 

In case the first option is picked, so global installation, it should already be available in your path, i.e., meaning in the `PATH` environment variable.

In either cases, the name of the application is `lcfetcher` (and not `leetcode-fetcher`).