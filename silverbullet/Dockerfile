ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN deno install -f --name silverbullet --unstable -A https://get.silverbullet.md/

CMD [ "ls /data && silverbullet /data -L 0.0.0.0 -p 8099" ]
