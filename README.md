# 🌐 Cloudflare DNS CLI Tool

This is a **Node.js** CLI tool to manage DNS records in your **Cloudflare** account. 
It allows you to list, create, update, delete, and auto refresh DNS records using Cloudflare's API.

---

## ⚙️ Features

- ✅ List all DNS records in a zone
- ➕ Create new `A` records
- ✏️ Update DNS records by index, comment, or with your current public IP
- ❌ Delete DNS records
- 🌍 Auto-refresh records based on public IP

---

## 📦 Prerequisites

- **Node.js** 20.18.3  
- `.env` file with required credentials
- A **Cloudflare** account with API Key access  

---

## 📁 Installation

```bash
git clone https://github.com/your-username/cloudflare-dns-cli.git
cd cloudflare-dns-cli
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root folder with the following content:

```env
CF_EMAIL=your-cloudflare-email
CF_API_KEY=your-global-api-key
CF_ZONE_ID=your-zone-id
```

> 🔑 You can find your Global API Key and Zone ID in your Cloudflare dashboard.

---

## 🧪 Usage

Run the script using:

```bash
node .
```

### 📖 Commands

```bash
node . help
```

Displays available commands.

#### 📋 List all DNS records

```bash
node . list
```

#### ➕ Create a new DNS record

```bash
node . create <domain> <ip> [proxied]
```

Example:

```bash
node . create sub.example.com 192.0.2.1 true
```

#### 🗑️ Delete a record by index

```bash
node . delete <index>
```

> Index is shown via the `list` command.

#### 🔄 Update a record by index

```bash
node . update <index> <new_ip> [proxied]
```

Example:

```bash
node . update 2 203.0.113.5 false
```

#### ♻️ Refresh record using index with your current public IP

```bash
node . refresh-by-index <index>
```

#### 🏷️ Refresh record using comment (match by `comment` field)

```bash
node . refresh-by-comment <comment>
```

> Useful for automated IP updates on dynamic DNS records.

---

## 🛡️ Safety Prompts

Each destructive or modifying action includes a confirmation prompt to prevent accidental changes.

---

## 🌐 Public IP Detection

The tool fetches your current public IP using Cloudflare’s `cdn-cgi/trace` service.

---

## 🧼 Example Workflow

```bash
node . list
node . create short_or_long_subdomain 192.0.2.10 true
node . update 1 192.0.2.20 false
node . refresh-by-index 1
node . refresh-by-comment dns_to_refresh
node . delete 2
```

---

## Important Data
### Node Version used in this project: 
- 20.18.3 (codename iron)
### Cloudflare documentation URL:
- https://developers.cloudflare.com/api/node/resources/dns/subresources/records/methods/
