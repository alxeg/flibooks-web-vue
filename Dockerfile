ARG BACKEND_BASE_IMAGE
ARG BACKEND_API_VERSION=v1

FROM node:24-alpine AS build

ARG BACKEND_API_VERSION

ENV VITE_API_VERSION=${BACKEND_API_VERSION}

WORKDIR     /build

ADD         . /build

RUN npm i && \
    npm run build

FROM ${BACKEND_BASE_IMAGE}

COPY --from=build /build/dist/ /flibooks/static/

RUN echo "" >> /flibooks/flibooks.properties && \
    echo "ApiPrefix = /api" >> /flibooks/flibooks.properties  && \
    echo "" >> /flibooks/flibooks.properties
