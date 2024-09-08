FROM alpine:3
LABEL maintainer="VolgaCTF"

ARG BUILD_DATE
ARG BUILD_VERSION
ARG VCS_REF

LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.name="volgactf-final-visualization"
LABEL org.label-schema.description="VolgaCTF Final Visualization"
LABEL org.label-schema.url="https://volgactf.ru/en"
LABEL org.label-schema.vcs-url="https://github.com/VolgaCTF/volgactf-final-visualization"
LABEL org.label-schema.vcs-ref=$VCS_REF
LABEL org.label-schema.version=$BUILD_VERSION

WORKDIR /app
COPY VERSION index.html entrypoint.sh .
COPY js ./js
COPY assets ./assets
RUN addgroup volgactf && adduser --disabled-password --gecos "" --ingroup volgactf --no-create-home volgactf && chown -R volgactf:volgactf .
USER volgactf
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]