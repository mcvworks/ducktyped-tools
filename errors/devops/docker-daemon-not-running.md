# Docker Daemon Not Running

Canonical source: https://ducktyped.xyz/errors/devops/docker-daemon-not-running

Last reviewed: September 24, 2026

The Docker client cannot reach its selected engine. Identify the endpoint first, then check the service, Docker Desktop, permissions, or remote connection that owns it.

**You might see this error as:**

- `Docker daemon not running`
- `Cannot connect to the Docker daemon`
- `Is the docker daemon running?`
- `docker.sock: connect: permission denied`
- `Error: Cannot connect to the Docker daemon`

## What Does This Error Mean?

The Docker CLI and the Docker Engine are separate. A working `docker --version` only proves the client is installed. Commands that need the engine, such as `docker ps`, fail when the selected daemon is stopped, unreachable, or inaccessible to your user. A remote engine can fail even while Docker runs locally.

## Common Causes

- **Wrong endpoint** — A context, DOCKER\_HOST, DOCKER\_CONTEXT, or command-line flag selects a different engine than the one you started.
- **Stopped engine** — The system service, rootless user service, or Docker Desktop engine is not running.
- **Socket access denied** — The daemon may be healthy, but the current user cannot open its Unix socket.
- **Desktop, WSL, or remote-host mismatch** — The terminal is in a different environment from the engine, or its integration, SSH connection, or TLS settings need attention.

## How to Diagnose and Fix It

### 1. Identify the engine your terminal is using

Run these read-only checks in the same terminal or job that fails. The active context has an asterisk in the list. Inspect its endpoint and compare it with the address in the error. Environment variables and explicit flags can override the saved selection. Do not publish context output containing internal hostnames or credentials.

```
docker version
docker context ls
docker context show
docker context inspect
```

### 2. Interpret the failure before changing settings

A **Client** section followed by a daemon error means the CLI starts but the server check failed. **Permission denied** points to socket access; a missing socket suggests a stopped engine or wrong path; an SSH or TLS error points to a remote connection. If `docker version` returns both Client and Server sections, engine connectivity works: diagnose the later build, image-pull, or container error separately.

### 3. Start the appropriate Linux service

For a conventional Docker Engine installation managed by systemd, inspect the system service, then start it only if it is stopped. For an existing **rootless** installation, use the user service instead. Docker Desktop for Linux is a separate engine; use Desktop and its context. A host without systemd needs its own service manager.

```
# System Docker Engine:
systemctl is-active docker
# If this is the intended engine and it is stopped:
sudo systemctl start docker

# Existing rootless Docker installation instead:
systemctl --user is-active docker
# If its user service is stopped:
systemctl --user start docker
```

### 4. Check Docker Desktop and WSL integration

On macOS or Windows, open Docker Desktop and wait until its engine is running. Retry from the terminal you actually use. For Linux containers in WSL, confirm that Desktop uses its WSL 2 backend and enables integration for that distribution under Settings → Resources → WSL Integration. A separately installed engine inside WSL can create a second, conflicting setup. Restarting Desktop interrupts workloads; reserve that step for an engine that remains unresponsive.

### 5. Correct an unintended context or environment override

Choose a context shown by `docker context ls`; context names vary by installation. The example below inspects the default context, then tests it for one command without changing your saved selection. In a POSIX shell, `printenv DOCKER_HOST DOCKER_CONTEXT` shows overrides. In PowerShell, inspect `$env:DOCKER_HOST` and `$env:DOCKER_CONTEXT`. Remove an override only when it is unintended; a remote deployment may depend on it.

```
docker context inspect default
# Only if default points to the engine you intend to use:
docker --context default version
```

### 6. Handle socket permissions deliberately

For a conventional Linux engine using `/var/run/docker.sock`, inspect the socket owner and your groups. An administrator can grant trusted users access through the configured Docker group. That group grants root-level control of the host; do not make the socket world-writable. Rootless Docker uses a user-owned socket and does not require joining the system Docker group. Sign out and back in after an approved group change.

```
# For the conventional system socket only:
ls -l /var/run/docker.sock
id -nG
```

### 7. Read the relevant logs and verify the repair

On a systemd host, use the log for the engine you selected. Look for the first startup failure, such as conflicting daemon settings or exhausted storage, before changing configuration. For a remote context, inspect the remote host and its SSH/TLS access. After the repair, both the version check and container listing below should succeed. The listing is read-only and may legitimately be empty.

```
# System engine logs:
sudo journalctl -u docker.service --no-pager -n 50
# Rootless engine logs instead:
journalctl --user -u docker.service --no-pager -n 50

# Verify in the original failing terminal:
docker version
docker ps
```

## Frequently Asked Questions

### Why does Docker work in one terminal but fail in another?

The terminals can use different users, contexts, environment variables, or WSL distributions. Compare the selected endpoint and permissions in the failing environment before restarting an engine.

### Does docker --version prove that the daemon is running?

No. It reports the installed client version. Use docker version to request server information, or docker ps to test an engine operation.

### Should I use chmod 666 on docker.sock?

No. Making the Docker socket accessible to every local user can grant control of the host. Use an administrator-approved access policy or a correctly configured rootless engine.

### Is a Docker Hub outage the same as a daemon connection error?

No. A registry outage can affect pulling or pushing images after the client connects to the engine. It does not explain failure to open a local Unix socket. If the engine responds but image pulls fail, check the registry status and network separately.

## Related Errors and Guides

- [Docker Port Already Allocated](<https://ducktyped.xyz/errors/devops/docker-port-already-allocated>) — A container cannot bind its requested port
- [Docker No Space Left](<https://ducktyped.xyz/errors/devops/docker-no-space-left>) — Storage failures after reaching the engine
- [Permission Denied (publickey)](<https://ducktyped.xyz/errors/devops/permission-denied-publickey>) — SSH authentication errors with a remote host
- [Check a Compose file after restoring engine access](<https://ducktyped.xyz/learn/docker-compose-validator/>)
- [Docker Hub status for registry failures](<https://monitor.ducktyped.xyz/status/dockerhub>)

## Sources and Review

Reviewed against the official documentation below. Commands use example hostnames and paths; choose the branch that matches your installation.

- [Docker daemon troubleshooting](<https://docs.docker.com/engine/daemon/troubleshoot/>)
- [Docker contexts](<https://docs.docker.com/engine/manage-resources/contexts/>)
- [Rootless Docker](<https://docs.docker.com/engine/security/rootless/>)
- [Linux socket access](<https://docs.docker.com/engine/install/linux-postinstall/>)
- [Docker Desktop and WSL](<https://docs.docker.com/desktop/features/wsl/>)
