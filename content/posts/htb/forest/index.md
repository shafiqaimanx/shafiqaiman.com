---
weight: 1
title: "HackTheBox - Forest Writeup"
date: 2024-02-27
draft: false
author: "SH∆FIQ ∆IM∆N"
authorLink: "https://shafiqaiman.com"
description: "HacktheBox - Forest Writeup"
images: []
resources:
- name: "featured-image"
  src: "featured.png"

tags: ['ldapsearch', 'GetNPUsers.py', 'rpcclient', 'ASREPRoast', 'evil-winrm', 'bloodhound', 'account-operators-group', 'writedacl', 'powerview.ps1', 'secretsdump.py', 'DCSync-attack', 'psexec.py', 'psexec-hash', 'hashcat', 'kerberos', 'sharphound', 'ldap']
categories: ["HacktheBox", "Windows", "Active Directory 101"]

lightgallery: true
toc:
  auto: false
---

Box author | {{< person url="https://app.hackthebox.com/users/2984" name="mrb3n" picture="https://www.hackthebox.com/storage/avatars/adb3d560986d35b4fdd9605bae289ea9.png" >}} {{< person url="https://app.hackthebox.com/users/1190" name="egre55" picture="https://www.hackthebox.com/storage/avatars/a9527867b56b74bd7de6f0b940a04916.png" >}}

<!--more-->

## Nmap
Like always, I’m going to scan the IP Address by using [nmap](https://nmap.org/) but I’m going to scan the full port first. Then, I’m going to scan the only open ports.

```sql
# Nmap 7.94 scan initiated Wed Oct  4 11:53:44 2023 as: nmap -sCV -p135,139,3268,3269,389,445,464,47001,49664,49666,49667,49671,49676,49677,49684,49703,49940,53,593,636,88,9389 -oN nmap/forest 10.10.10.161
Nmap scan report for htb.local (10.10.10.161)
Host is up (0.032s latency).

PORT      STATE SERVICE      VERSION
53/tcp    open  domain       Simple DNS Plus
88/tcp    open  kerberos-sec Microsoft Windows Kerberos (server time: 2023-10-04 04:00:42Z)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp   open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
445/tcp   open               Windows Server 2016 Standard 14393 microsoft-ds (workgroup: HTB)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
9389/tcp  open  mc-nmf       .NET Message Framing
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49664/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49667/tcp open  msrpc        Microsoft Windows RPC
49671/tcp open  msrpc        Microsoft Windows RPC
49676/tcp open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49677/tcp open  msrpc        Microsoft Windows RPC
49684/tcp open  msrpc        Microsoft Windows RPC
49703/tcp open  msrpc        Microsoft Windows RPC
49940/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: FOREST; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
| smb-os-discovery: 
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: FOREST
|   NetBIOS computer name: FOREST\x00
|   Domain name: htb.local
|   Forest name: htb.local
|   FQDN: FOREST.htb.local
|_  System time: 2023-10-03T21:01:34-07:00
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2023-10-04T04:01:32
|_  start_date: 2023-10-02T17:03:32
|_clock-skew: mean: 2h26m52s, deviation: 4h02m31s, median: 6m50s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Wed Oct  4 11:54:50 2023 -- 1 IP address (1 host up) scanned in 66.48 seconds
```

The nmap scan result is completed and that's a bunch of open ports. Based on the ports itself, it's look like a `Domain Controller`.

On top of that, nmap also found the domain name called `htb.local`. So, I'm going to add that to the `/etc/hosts` file.

![add domain name](add-domain-name.png "add domain name")

## LDAP: ldapsearch
This machine doesn't have any web server to check it out and I tried to list the `SMB` shares with anonymous access and it failed. Then, I'll start to enumerate the `LDAP` server by using `ldapsearch` and find a list of users. I saved those lists of users in the file called `users.txt`. 

![enum users using ldapsearch](enum-users-using-ldapsearch.png "enum users using ldapsearch")

Unfortunately, I was stuck at this point and did not know what to do next. However, [HacktheBox](https://www.hackthebox.com/) just released a new feature called [Guided Mode](https://www.hackthebox.com/blog/guided-mode) which is the perfect training companion for beginners. I used that as an advantage and it says, I need to find a user who has `Kerberos Pre-Authentication` disabled.

## Impacket: GetNPUsers.py
Based on the description above, I need to find a user that is vulnerable to an `asreproast` attack. Then, I executed the [impacket](https://github.com/fortra/impacket) script called `GetNPUsers.py` alongside the list of users and it did not find anything at all.

![asreproast with users file](asreproast-against-users-file.png "asreproast with users file")

## Rpcclient: enumdomusers
Then, I remembered that `rpcclient` can be used to enumerate `users` on this machine. After successfully establishing a connection with anonymous access. I searched the users by executing the `enumdomusers` command and it did manage to find another user which is `svc-alfresco`.

![rpcclient enumdomusers](rpcclient-enumdomusers.png "rpcclient enumdomusers")

### ASREPRoast: GetNPUsers.py
With that information in hand, I'll execute the `GetNPUsers.py` script once again. Instead of using a list of users, I'm going to dump the hash of the `svc-alfresco` user only. After successfully dumping the hash, I'm going to crack it using [hashcat](https://hashcat.net/hashcat/).

![svc-alfresco hash](svc-alfresco-hash.png "svc-alfresco hash")

![cracked svc-alfresco hash](cracked-svc-alfresco-hash.png "cracked svc-alfresco hash")

## Evil-winrm: svc-alfresco
Since I already have valid credentials, I'm going to connect to it as a `svc-alfresco` user. I'm in as a `svc-alfresco` user.

![login as svc-alfresco](login-as-svc-alfresco.png "login as svc-alfresco")

### BloodHound
After successfully logging in. I'm going to drop the [SharpHound](https://github.com/Flangvik/SharpCollection) binary in the machine for enumerating the `Active Directory` using the `upload` command provided by [evil-winrm](https://github.com/Hackplayers/evil-winrm). Then, I executed it and saved the output into the `zip` file.

![executing SharpHound](executing-SharpHound.png "executing SharpHound")

For analyzing the `zip` file data. I'm going to fire up the `neo4j console` with the `sudo` privilege. I'll start up the `BloodHound` and import the `zip` file by clicking the `Upload Data` button on the right navigation bar.

![upload data in bloodhound](upload-data-in-bloodhound.png "upload data in bloodhound")

After successfully importing the data. I'll search for `SVC-ALFRESCO@HTB.LOCAL` node and `Mark User as Owned` by right-clicking on the node.

![mark user owned](mark-user-owned.png "mark user owned")

Now, I'm going to analyze the data from the owned user which is `svc-alfresco` by clicking the `burger menu` on the top left and clicking the `Analysis` button, and choosing the `Shortest Paths to High Value Targets`.

![shortest path](shortest-path.png "shortest path")

### Groups: Account Operators

Honestly, the graph view is confusing. However, the current user is a member of `SERVICE ACCOUNT` -> `PRIVILEGED IT ACCOUNT` -> `ACCOUNT OPERATORS` and with quick googling, I found Microsoft [documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups#account-operators) about it. Turns out, the `Account Operators` group, it's a quite powerful group in this case, which can be used to create and modify accounts.

{{< admonition tip "Description" >}}
The **Account Operators** group grants limited account creation privileges to a user. Members of this group can create and modify most types of accounts, including accounts for users, Local groups, and Global groups. Group members can log in locally to domain controllers.
{{< /admonition >}}

![svc-alfresco member of Account Operators](svc-alfresco-member-of-Account-Operators.png "svc-alfresco member of Account Operators")


The `Account Operators` group has `GenericAll` permission on the `Exchange Windows Permissions` groups. This permission essentially gives members full control of the group and allows members to directly modify group membership.

On top of that, the `EXCHANGE WINDOWS PERMISSIONS` group has `WriteDacl` permission on the domain `HTB.LOCAL` and it can be used to abuse the `DCSync` attack on the domain.

![path to abuse Exchange Windows Permissions](path-to-abuse-Exchange-Windows-Permissions.png "path to abuse Exchange Windows Permissions")

By right-clicking the `WriteDacl` button and `Help` menu. Another window will appear by giving some information on that permission. I'll click the Windows Abuse section and it shows the steps on how to abuse it.

![WriteDacl information](WriteDacl-information.png "WriteDacl information")

Based on the information above, I'll create another user called `shafiq` on the target machine and added to the `Exchange Windows Permissions` groups.

![create shafiq user](create-another-user-called-shafiq.png "create shafiq user")

### Impacket: secretsdump.py

I'll upload the [PowerView.ps1](https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1) to the target machine, which is located at `/usr/share/windows-resources/powersploit/Recon/PowerView.ps1` on the [Kali](https://www.kali.org/) machine and imported into my current PowerShell session like this `. .\PowerView.ps1`. Then, I'll give the `DCSync` rights to the `shafiq` user by executing the command below.

```powershell
$SecPassword = ConvertTo-SecureString 'P@ssw0rd1' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('HTB\shafiq', $SecPassword)
Add-DomainObjectAcl -Credential $Cred -TargetIdentity "DC=htb,DC=local" -PrincipalIdentity shafiq -Rights DCSync
```

![given DCSync rights to shafiq](given-DCSync-rights-to-shafiq.png "given DCSync rights to shafiq")

After successfully executing the commands without any errors. I'll start to perform the `DCSync` attack by using another [impacket](https://github.com/fortra/impacket) script called `secretsdump.py` by supplying shafiq's credential.

![DCSync dumping hash](DCSync-dumping-hash.png "DCSync dumping hash")

## PsExec

Then, I'll use another [impacket](https://github.com/fortra/impacket) script called `psexec.py` and log in as `Administrator` using the technique called `Pass-The-Hash` and it succeeds. I’m in as `NT AUTHORITY\SYSTEM`.

![login as nt authority\system](psexec-administrator.png "login as nt authority\system")