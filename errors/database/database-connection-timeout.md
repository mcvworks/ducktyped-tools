# Database Connection Timeout

Canonical source: https://ducktyped.xyz/errors/database/database-connection-timeout

Last reviewed: September 24, 2026

Identify which stage timed out: name lookup, TCP connection, TLS or login, waiting for a pooled connection, or running a query. Each needs a different fix.

**You might see this error as:**

- `Database connection timeout`
- `Connection timed out to database`
- `ETIMEDOUT database`
- `db connection timeout`
- `Unable to connect to database server`

## What Does This Error Mean?

A timeout means a client or application reached a waiting limit. It does not, by itself, prove a firewall dropped packets. A database connection involves several stages, and an application may also time out while waiting to borrow an existing connection. Record the complete error and elapsed time, without copying credentials from a connection string.

## Common Causes

- **Name or network failure** — The app resolves the wrong address or cannot reach the database endpoint through its route, VPN, or firewall.
- **TLS or login does not complete** — The endpoint is reachable, but the secure connection or authentication step fails or stalls.
- **No pooled connection available** — All connections are busy or a code path borrowed one without returning it.
- **A query or transaction runs too long** — The connection already exists, but execution is slow, blocked by locks, or limited by a statement timeout.

## How to Diagnose and Fix It

### 1. Test from the environment where the app runs

Use the failing server, container, or pod and the app’s configured hostname and port. A successful test from your laptop does not establish connectivity from the app. `localhost` inside a container refers to that container. Check deployment variables for a stale host, port, or TLS option without printing the password. For a managed database, also check the provider’s service status and recent maintenance.

### 2. Check name resolution and the TCP port

On Linux with these utilities installed, replace the example hostname and test the actual port; 5432 and 3306 are common defaults, not requirements. `getent` uses the host’s name-service configuration. On Windows, use PowerShell `Test-NetConnection db.example.com -Port 5432`. A public web-based port check cannot reproduce private-network or per-client firewall access.

```
getent ahosts db.example.com

# Netcat syntax shown is for OpenBSD-style nc:
nc -vz -w 5 db.example.com 5432
# For a MySQL endpoint instead:
nc -vz -w 5 db.example.com 3306
```

### 3. Read the result at the correct layer

**No address:** investigate DNS in the app environment. **Connection refused:** the target or an intermediary actively rejected the attempt; check the listener and endpoint. **Timeout:** inspect routing, VPN, security groups, and firewall logs; silence alone does not identify which component failed. **TCP success:** a port accepted the connection, but database login and TLS are still untested. Limit any network rule change to the required application source and database port.

### 4. Use PostgreSQL’s own client to test readiness and login

`pg_isready` reports whether the endpoint responds as a PostgreSQL server; it does not prove your application can authenticate. Use the matching database, user, and hostname with `psql`, keeping certificate and hostname verification enabled. Replace the CA path with the bundle supplied for your database. `-W` prompts for a password instead of placing one in shell history. Successful `SELECT 1` confirms this client completed a connection and a simple query.

```
pg_isready -h db.example.com -p 5432 -t 5

psql "host=db.example.com port=5432 dbname=appdb user=app_user connect_timeout=5 sslmode=verify-full sslrootcert=/path/to/database-ca.pem" -W -c "SELECT 1;"
```

### 5. Use MySQL’s client to test TCP, TLS, and login

For the MySQL 8.4 client, `--protocol=TCP` avoids accidentally testing a local socket. Use the service’s documented CA and DNS hostname with `VERIFY_IDENTITY`. `--password` without a value prompts securely. An access-denied or certificate error narrows the problem to that layer; increasing the timeout or disabling verification does not repair it. MariaDB clients and application drivers can use different option names.

```
mysql --protocol=TCP --host=db.example.com --port=3306 \
  --user=app_user --password --database=appdb --connect-timeout=5 \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=/path/to/database-ca.pem \
  --execute="SELECT 1;"
```

### 6. Inspect pool saturation and slow queries separately

If the command-line client succeeds from the app environment but the application still times out, compare its driver settings and inspect pool metrics: connections in use, idle connections, and queued requests. Return borrowed clients on success and failure; in node-postgres this normally means `client.release()` in a `finally` block. Size pools across all app instances against the server’s connection budget. For a query timeout, inspect active queries and locks; a longer connection timeout will not shorten an already-running query.

### 7. Verify the fix before changing timeout budgets

Repeat the same failing operation from the original environment, then check connection latency and pool wait time under representative load. PostgreSQL’s libpq `connect_timeout` can apply separately to multiple configured hosts; it is not a universal deadline for the whole application request. Raise a timeout only when measured healthy connection times justify it. Retry transient failures with bounded backoff, and avoid automatically retrying writes whose outcome is unknown.

## Frequently Asked Questions

### What is the difference between connection, pool, and query timeouts?

A connection timeout limits establishing a new connection. A pool timeout limits waiting to borrow one. A query timeout limits work after connecting. The exact boundaries and setting names depend on the client library.

### Why does the database work locally but time out from a container?

The container may use different DNS, routing, credentials, or TLS settings. Its localhost is not the database host. Test the configured endpoint from the container and compare those settings with the working client.

### Does a successful port check prove the database works?

No. It only shows that a TCP connection was accepted from that location. Use the database client with the intended TLS and login settings, then run a simple query.

### Should I increase the timeout first?

First identify the stage and cause. Longer waits do not fix an incorrect endpoint, blocked route, invalid certificate, or leaked pool client. Adjust the budget after measuring healthy behavior.

## Related Errors and Guides

- [PostgreSQL Connection Refused](<https://ducktyped.xyz/errors/database/postgresql-connection-refused>) — The connection is actively rejected
- [Too Many Database Connections](<https://ducktyped.xyz/errors/database/database-too-many-connections>) — The server connection budget is exhausted
- [Temporary Failure in Name Resolution](<https://ducktyped.xyz/errors/dns/temporary-failure-in-name-resolution>) — Resolve a name-lookup failure first
- [Interpret DNS records](<https://ducktyped.xyz/learn/dns-lookup/>)
- [Understand what a TCP port check can establish](<https://ducktyped.xyz/learn/port-scanner/>)

## Sources and Review

Reviewed against the official documentation below. Commands use example hostnames and paths; choose the branch that matches your installation.

- [PostgreSQL connection parameters](<https://www.postgresql.org/docs/current/libpq-connect.html>)
- [pg\_isready exit status and limitations](<https://www.postgresql.org/docs/current/app-pg-isready.html>)
- [PostgreSQL certificate verification](<https://www.postgresql.org/docs/current/libpq-ssl.html>)
- [MySQL client connection options](<https://dev.mysql.com/doc/refman/8.4/en/connection-options.html>)
- [MySQL encrypted connections](<https://dev.mysql.com/doc/refman/8.4/en/using-encrypted-connections.html>)
- [node-postgres pooling](<https://node-postgres.com/features/pooling>)
