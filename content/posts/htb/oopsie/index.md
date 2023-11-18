---
weight: 1
title: "HackTheBox - Oopsie Writeup"
date: 2021-07-20
draft: false
author: "SH∆FIQ ∆IM∆N"
authorLink: "https://shafiqaiman.com"
images: []
resources:
- name: "featured-image"
  src: "featured.png"

tags: ["SUID", "path-abused", "upload-vuln", "gobuster", "python", "php-reverse-shell"]
categories: ["HacktheBox","Linux"]

lightgallery: true
toc:
  auto: false
---

Box author | {{< person url="https://app.hackthebox.com/users/13531" name="MrR3boot" picture="https://www.hackthebox.com/storage/avatars/45c15da90175761bef77ecb2d44942b4.png" >}}

<!--more-->

## Enumeration

- Top 1000 ports scan

```bash
nmap -sC -sV -oN nmap/inital 10.10.10.28
```

![nmap initial scan](2.png "nmap initial scan")

- all ports scan

```bash
nmap -sC -sV -p- -oN nmap/all_ports 10.10.10.28
```

![nmap allports scan](3.png "nmap allports scan")

- Still the same result 
- Open ports
	- port 22 / ssh 
	- port 80 / http


### The Website
![MegaCorp Automotive webpage](4.png "MegaCorp Automotive webpage")

### Gobuster
- Auto recon in the background
- looking the hidden directory

```bash
gobuster dir -u http://10.10.10.28 -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt -o gobuster.log
```
- The result

![gobuster](5.png "gobuster")

This webpage have an upload directory.

### Login Page
- Found something insteresting in the source code


![view source code](6.png "view source code")

- the directory into `/cdn-cgi/login/script.js`
- navigate into `http://10.10.10.28/cdn-cgi/login`
- found the login page

![login page](7.png "login page")

- Got the credentials in previous box called [Archetype](https://shafiqaiman.com/posts/htb/archetype/) _in official pdf_
- Successfully login as admin

![admin webpage](8.png "admin webpage")

### Can't Upload
- navigate to the upload page
- it says `super admin` have right to view it

![can't view upload page](9.png "can't view upload page")

### The ID

![id parameter](10.png "id parameter")

- This page appear to be `user table` base on the `id parameter` in the link
- Making `python script` for IDs brute-force 

## Foothold/Gaining Access

### Python Script
- python script for ID brute force
- need cookies for authentication

```python
#!/usr/bin/env python3

import requests

for i in range(101):
    url = f"http://10.10.10.28/cdn-cgi/login/admin.php?content=accounts&id={i}"
    c = {'user':'34322','role':'admin'}
    r = requests.get(url, cookies=c)

    if len(r.content) == 3595: # nothing appear just pass it
        pass
    else:
        print(f"Check this ID out {i}")
print("Done")
```
- The result

![brute-force id](11.png "brute-force id")

- Here is the ID lead to (in order)

```javascript
{'access id':'34322','name':'admin','email':'admin@megacorp.com'}
{'access id':'8832','name':'john','email':'john@tafcz.co.uk'}
{'access id':'57633','name':'Peter','email':'peter@qpic.co.uk'}
{'access id':'28832','name':'Rafol','email':'tom@rafol.co.uk'}
{'access id':'xxxxx','name':'super admin','email':'superadmin@megacorp.com'}
```

### Upload as super admin
- Found the super admin table

![found superadmin table](12.png "found superadmin table")

- Turns out the `Access ID` it is the `cookie value`
- Change the admin cookies into super admin

![admin cookie](13.png "admin cookie") <br>_before_

![superadmin cookie](14.png "superadmin cookie") <br>_after refresh the page_

### Reverse Shell
- Upload the php reverse shell
  - [Here is the source ](https://raw.githubusercontent.com/pentestmonkey/php-reverse-shell/master/php-reverse-shell.php)

![upload php reverse shell](15.png "upload php reverse shell")

- Activated the reverse shell
  - through this link

![execute the shell](16.png "execute the shell")

- Got the shell

![shell as www-data](17.png "shell as www-data")

### www-data
- Found the credentials in file called `db.php`
- in `/var/www/html/cdn-cgi/login/db.php`

![found robert credentials](18.png "found robert credentials")

### Robert
- Login as robert

![change user to robert](19.png "change user to robert")

### User Flag

![user flag](20.png "user flag")

- Find the <font color="yellow">SUID</font>
- The command for find it

```bash
find / -user root -perm -4000 -exec ls {} \; 2>/dev/null
```
- Found weird binary that not suppose to be there

![find all SUID](21.png "find all SUID")

## Privilege Escalation

### Bugtracker
- This is how it works
- However it says `no such file or directory`

![cat error](22.png "cat error")

- Try `strings` out the binary 
- Turns out this binary use `cat command`
- However this is use relative path

![strings bugtracker](23.png "strings bugtracker")

- explain the _`relative & absolute path`_

![relative & absolute path differences](24.png "relative & absolute path differences")

### Relative Path Abused
- Make a fake `cat command`
	- by puting `/bin/bash` in it
	- the bugtracker binary will execute this fake file as `root`
	- [source for relative path abused](https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/)

![shell as root](25.png "shell as root")

### Root Flag

![root flag](26.png "root flag")

## Conclusion
I’ve learned a lot today. Never put the user ID as cookies value and make sure you configure the website properly. Lastly, make sure to configure the SUID binary carefully and do not put any untrust or unpatched version as SUID

I have a fun time doing this machine and I hope you guys too. Bye ;)