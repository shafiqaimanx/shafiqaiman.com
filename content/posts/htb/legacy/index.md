---
weight: 1
title: "HackTheBox - Legacy Writeup"
date: 2021-07-20
draft: false
author: "SH∆FIQ ∆IM∆N"
authorLink: "https://shafiqaiman.com"
images: []
resources:
- name: "featured-image"
  src: "featured.png"

tags: ["CVE-2008-4250", "ms08-067", "legacy"]
categories: ["HacktheBox","Windows"]

lightgallery: true
toc:
  auto: false
---

Box author | {{< person url="https://app.hackthebox.com/users/1" name="ch4p" picture="https://www.hackthebox.com/storage/avatars/08c255a334e10b3033ab7263e6b32422.png" >}}

<!--more-->

## Enumeration

First, let’s do an enumeration with the IP address of this machine. I’m gonna run Nmap [Netwok Mapper] to scan any open ports. I’m gonna run this command

```bash
nmap -sC -sV -oN nmap/initial 10.10.10.4
```
### Explaining the nmap scan:
* -sC	:= scan using nmap default script
* -sV	:= scan for version
* -oN := output in normal format

The result:

![nmap initial scan](1.png "nmap initial scan")

Again, using Nmap for scanning all ports but nothing new comes up.

Anyway, the Nmap scan result shows us this is a Windows XP machine.
Also, have smb on it. When I saw smb on Windows XP that's will be an EternalBlue exploit but I'm gonna run the Nmap `smb-vuln` script anyway.

```bash
nmap --script smb-vuln* -p139,445 10.10.10.4 -oN nmap/vuln_scan 
```

The result:

![NSE check smb vulnerability](2.png "NSE check smb vulnerability")

WOW! we've got the result back. The result shows us this machine vulnerable to RCE and Eternalblue attacks.

## Foothold/Gaining Access

So, I'm gonna use metasploit and seach `ms08-067` and use it.

![use ms08-067 exploit](3.png "use ms08-067 exploit")

Before we can use it. We need to set up the module first. So, I'm gonna set the `RHOSTS` into this machine ip address which is `10.10.10.4`. Then, I'm gonna set the `LHOST` into `tun0` which is my HTB ip address is.

![default metasploit option](4.png "default metasploit option")
_before_

![modify metasploit option](5.png "modify metasploit option")
_after_

After that just type `run`.

![get the shell](6.png "get the shell")

## Oopsie

The first thing we gonna check is `whoami`. So, I'm gonna use the `getuid` command

![shell as nt authority\system](7.png "shell as nt authority\system")

COOL! WE'RE THE SYSTEM!

Now, let's hunt for the user & admin flag.

### <u>User flag</u>

![user flag](8.png "user flag")

### <u>Root/Admin flag</u>

![root flag](9.png "root flag")

## Conclusion

I’ve learned a lot today. Always, update your system. We can see this machine so vulnerable even the Nmap scan shows us there are 2 "holes" in it. That "hole" needs to fix/update ASAP.

I have a fun time doing this machine and I hope you guys too. Bye ;)