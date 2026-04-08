FROM alpine:3.20

# git, openssh (für GitHub-Auth), rsync (zum Kopieren), tzdata (korrekte Cron-Zeiten)
RUN apk add --no-cache git openssh rsync tzdata

# GitHub SSH Known Host vorausfüllen (verhindert interaktive Bestätigung beim ersten Push)
RUN mkdir -p /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts && \
    chmod 700 /root/.ssh

# Backup-Skript
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Log-Datei anlegen
RUN touch /var/log/backup.log

# Cron-Tab aus Umgebungsvariable generieren und crond starten
CMD ["/bin/sh", "-c", \
     "echo \"${BACKUP_SCHEDULE:-0 3 * * *} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1\" \
      > /etc/crontabs/root && \
      echo 'Backup-Container gestartet. Zeitplan: '\"${BACKUP_SCHEDULE:-0 3 * * *}\" && \
      crond -f -l 2"]
