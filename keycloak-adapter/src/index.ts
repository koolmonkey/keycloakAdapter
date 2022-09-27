/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * JBoss, Home of Professional Open Source
 * Copyright 2016, Red Hat, Inc. and/or its affiliates, and individual
 * contributors by the @authors tag. See the copyright.txt in the
 * distribution for a full listing of individual contributors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import Keycloak from "keycloak-connect";
import hogan from "hogan-express"; // @ts-ignore
import cors from "cors";

const app = express();
app.use(bodyParser.json());

// Enable CORS support
app.use(cors());

app.set("view engine", "html");
app.set("views", require("path").join(__dirname, "/view"));
app.engine("html", hogan);

app.get("/", function (req, res) {
  res.render("index");
});

// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: "mySecret",
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

const keycloak = new Keycloak({
  store: memoryStore,
});

app.use(keycloak.middleware({
  logout: "/logout",
  admin: "/",
  // protected: "/protecte/resource",
}));

app.get("/login", keycloak.protect(), function (req, res) {
  res.render("index", {
    result: JSON.stringify(JSON.parse(req.session["keycloak-token"]), null, 4),
    event: "1. Authentication\n2. Login",
  });
});

app.get(
  "/protected/resource",
  keycloak.protect("realm:user"),
  function (req, res) {
    res.render("index", {
      result: JSON.stringify(
        JSON.parse(req.session["keycloak-token"]),
        null,
        4,
      ),
      event: "1. Access granted to Default Resource\n",
    });
  },
);

app.get("/service/public", function (req, res) {
  res.json({ message: "public" });
});

// realm:<role>
app.get(
  "/service/secured",
  keycloak.protect("realm:user"),
  function (req, res) {
    res.json({ message: "secured" });
  },
);

app.get("/service/admin", keycloak.protect("realm:admin"), function (req, res) {
  res.json({ message: "admin" });
});

app.use("*", function (req, res) {
  res.send("Not found!");
});

app.listen(3000, function () {
  console.log("Started at port 3000");
});
