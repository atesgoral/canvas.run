#!/bin/bash

wait-for-port mongodb 27017
nodemon index
