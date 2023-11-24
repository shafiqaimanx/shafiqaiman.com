---
weight: 1
title: "HackTheBox - Blue Writeup"
date: 2021-07-20
draft: false
author: "SH∆FIQ ∆IM∆N"
authorLink: "https://shafiqaiman.com"
description: "HacktheBox - Blue Writeup"
images: []
resources:
- name: "featured-image"
  src: "featured.png"

tags: ["legacy", "eternalblue"]
categories: ["HacktheBox","Windows"]

lightgallery: true
toc:
  auto: false
---

Box author | {{< person url="https://app.hackthebox.com/users/1" name="ch4p" picture="https://www.hackthebox.com/storage/avatars/08c255a334e10b3033ab7263e6b32422.png" >}}

<!--more-->

## Enumeration

First, let’s do an enumeration with the IP address of this machine. I’m gonna run Nmap [Netwok Mapper] to scan any open ports. I’m gonna run this command

```sql
nmap -sC -sV -oN nmap/initial 10.10.10.40
```
### Explaining the nmap scan:
* -sC	:= scan using nmap default script
* -sV	:= scan for version
* -oN := output in normal format

![nmap initial scan](2.png "nmap initial scan")

The Nmap scan is done. The result shows us this is a Windows 7 machine and has smb!

This is a very old machine. I'm pretty sure this is vulnerable to Eternalblue. Let's run the Nmap `smb-vuln` script to double-check.

```bash
nmap --script smb-vuln* -p139,445 -oN nmap/vuln_script 10.10.10.40
```

![NSE check vulnerable to Eternalblue](3.png "NSE check vulnerable to Eternalblue")

Yup. This machine is vulnerable to Eternalblue exploit.

## Foothold/Gaining Access

I'm gonna run Metasploit and search for `eternalblue` and use it

![search Eternalblue exploit](4.png "search Eternalblue exploit")

Before we run it. We need to set up the `RHOSTS` and `LHOST`. Make the lhost is set into your htb ip addr.

![setup listener ip and port](5.png "setup listener ip and port")

## Oopsie

After that just type `run`.

![execute the exploit](6.png "execute the exploit")

WE'RE IN AS SYSTEM!!! cool.

Now, let's hunt for the user & admin flag.

## User flag

![user flag](7.png "user flag")

## Root/Admin flag

![root flag](8.png "root flag")

## Conclusion

I’ve learned a lot today. Please update the system. In this case, I'm able to exploit using `EternalBlue` and become root. That's super scary.

I have a fun time doing this machine and I hope you guys too. Bye ;)