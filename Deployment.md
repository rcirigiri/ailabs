Steps to update code & deploy :

1. Clone the git repo in your local system. (Google to know about git repo cloning)

```
git clone git@github.com:rcirigiri/ailabs.git
```

2. Make changes in code
3. Commit & Push updated code to main branch

```
git push origin main
```

4. SSH into the server (Google to know what is SSH and how to login to server)

```
ssh -i ~/.ssh/ailabs.pem azureuser@20.127.200.44
```

Here is the private key

```
-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----
```

5. Go to code directory

```
cd /home/azureuser/FNOL
```

6. Pull from main branch

```
git pull origin main
```

7. Create build version

```
cd client && npm run build
```

8. Restart pm2

```
pm2 restart all
```
