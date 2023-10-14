---
title: "HackTheBox - Oopsie Writeup"
date: 2021-07-20
draft: false
tags: ["SUID", "path-abused", "upload-vuln"]
htb: "HacktheBox"
linux: "Linux"
---

## Enumeration

- Top 1000 ports scan

```sql
nmap -sC -sV -oN nmap/inital 10.10.10.28
```

![2](2.png)

- all ports scan

```sql
nmap -sC -sV -p- -oN nmap/all_ports 10.10.10.28
```

![3](3.png)

- Still the same result 
- Open ports
	- port 22 / ssh 
	- port 80 / http


### The Website
![4](4.png)

### Gobuster
- Auto recon in the background
- looking the hidden directory

```bash
gobuster dir -u http://10.10.10.28 -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt -o gobuster.log
```
- The result

![5](5.png)

This webpage have an upload directory.

### Login Page
- Found something insteresting in the source code


![6](6.png)

- the directory into `/cdn-cgi/login/script.js`
- navigate into `http://10.10.10.28/cdn-cgi/login`
- found the login page

![7](7.png)

- Got the credentials in previous box called [Archetype](/htb/archetype) _in official pdf_
- Successfully login as admin

![8](8.png)

### Can't Upload
- navigate to the upload page
- it says `super admin` have right to view it

![9](9.png)

### The ID

![10](10.png)

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

![11](11.png)

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

![12](12.png)

- Turns out the `Access ID` it is the `cookie value`
- Change the admin cookies into super admin

![13](13.png) <br>_before_

![14](14.png) <br>_after refresh the page_

### Reverse Shell
- Upload the php reverse shell
  - [Here is the source ](https://raw.githubusercontent.com/pentestmonkey/php-reverse-shell/master/php-reverse-shell.php)

![15](15.png)

- Activated the reverse shell
  - through this link

![16](16.png)

- Got the shell

![17](17.png)

### www-data
- Found the credentials in file called `db.php`
- in `/var/www/html/cdn-cgi/login/db.php`

![18](18.png)

### Robert
- Login as robert

![19](19.png)

### User Flag

![20](20.png)

- Find the <font color="yellow">SUID</font>
- The command for find it

```bash
find / -user root -perm -4000 -exec ls {} \; 2>/dev/null
```
- Found weird binary that not suppose to be there

![21](21.png)

## Privilege Escalation

### Bugtracker
- This is how it works
- However it says `no such file or directory`

![22](22.png)

- Try `strings` out the binary 
- Turns out this binary use `cat command`
- However this is use relative path

![23](23.png)

- explain the _`relative & absolute path`_

![24](24.png)

### Relative Path Abused
- Make a fake `cat command`
	- by puting `/bin/bash` in it
	- the bugtracker binary will execute this fake file as `root`
	- [source for relative path abused](https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/)

![25](25.png)

### Root Flag

![26](26.png)

## Conclusion
I’ve learned a lot today. Never put the user ID as cookies value and make sure you configure the website properly. Lastly, make sure to configure the SUID binary carefully and do not put any untrust or unpatched version as SUID

I have a fun time doing this machine and I hope you guys too. Bye ;)