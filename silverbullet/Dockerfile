ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN deno install -f --name silverbullet --unstable -A https://get.silverbullet.md/

COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
