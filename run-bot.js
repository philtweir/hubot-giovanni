#!/usr/bin/env node

// Certain parts of this may be copyright (MPL) to Mozilla Hubs, as well as parts for the Rocketchat folks under MIT. Any additions by philtweir are under MIT
// https://github.com/mozilla/hubs/blob/master/LICENSE

const options = {
  "--url": process.env.HUBS_URL
};

const puppeteer = require("puppeteer");
const querystring = require("query-string");

function log(...objs) {
  console.log.call(null, [new Date().toISOString()].concat(objs).join(" "));
}


class HubsDriver {
  constructor () {
    this.page = undefined;
    this.process = undefined;
  }

  callMethod(method, args) {
  }

  async subscribeToMessages() {
    const page = this.page;
    const handleMessage = ({ name, type, body }) => {
      this.log('MESSAGE');
      this.log(' Name: ' + name.username);
      this.log(' Type: ' + type);
      this.log(' Body: ' + body);

      var message = {
        _id: undefined,
        t: '',
        rid: 1,
        msg: body,
        attachments: [],
        alias: name.username,
        u: name
      };

      var meta = {
        roomType: '',
        roomName: 'Unknown Room'
      };

      this.process(
        null,
        message,
        meta
      );
    };
    await page.exposeFunction('giovanniHandleMessage', message => handleMessage(message));
    await page.exposeFunction('giovanniMoveToUser', (user, now) => this.moveToUser(user, now));

    await page.waitForFunction('window.APP.hubChannel !== undefined');
    await page.waitForFunction('window.APP.hubChannel.channel !== undefined');
    try {
      camera = await page.evaluate(() => {
        var scene = document.querySelector('a-scene');

          var hubPhxChannel = APP.hubChannel.channel;
          hubPhxChannel.on("message", ({ session_id, type, body, from }) => {
            const getAuthor = () => {
              const userInfo = APP.hubChannel.presence.state[session_id];
              if (userInfo) {
                return {
                  _id: userInfo.metas[0].profile.identityName,
                  username: userInfo.metas[0].profile.displayName
                };
              } else {
                return {
                  _id: -1,
                  username: "Mystery user"
                };
              }
            };

            const name = getAuthor();

            giovanniHandleMessage({ name, type, body });
          });
        // scene.emit("action_toggle_camera");
        return scene.outerHTML
      });
      this.log(camera);
    } catch (e) {
      this.log(e);
    }
  }
  respondToMessages(cb) {
    this.process = cb;
  }

  async moveToUser(user, now) {

    this.log(user);
    this.log(now);
    await this.page.evaluate(({user, now}) => {
        const messageDispatch = document.getElementById("avatar-rig").messageDispatch;
        // const { rotateInPlaceAroundWorldUp, affixToWorldUp } = main.require("./three-utils.js")
        const rotateInPlaceAroundWorldUp = (function() {
          const inMat4Copy = new THREE.Matrix4();
          const startRotation = new THREE.Matrix4();
          const endRotation = new THREE.Matrix4();
          const v = new THREE.Vector3();
          return function rotateInPlaceAroundWorldUp(inMat4, theta, outMat4) {
            inMat4Copy.copy(inMat4);
            return outMat4
              .copy(endRotation.makeRotationY(theta).multiply(startRotation.extractRotation(inMat4Copy)))
              .scale(v.setFromMatrixScale(inMat4Copy))
              .setPosition(v.setFromMatrixPosition(inMat4Copy));
          };
        })();
        const affixToWorldUp = (function() {
          const inRotationMat4 = new THREE.Matrix4();
          const inForward = new THREE.Vector3();
          const outForward = new THREE.Vector3();
          const outSide = new THREE.Vector3();
          const worldUp = new THREE.Vector3(); // Could be called "outUp"
          const v = new THREE.Vector3();
          const inMat4Copy = new THREE.Matrix4();
          return function affixToWorldUp(inMat4, outMat4) {
            inRotationMat4.identity().extractRotation(inMat4Copy.copy(inMat4));
            inForward.setFromMatrixColumn(inRotationMat4, 2).multiplyScalar(-1);
            outForward
              .copy(inForward)
              .sub(v.copy(inForward).projectOnVector(worldUp.set(0, 1, 0)))
              .normalize();
            outSide.crossVectors(outForward, worldUp);
            outMat4.makeBasis(outSide, worldUp, outForward.multiplyScalar(-1));
            outMat4.scale(v.setFromMatrixScale(inMat4Copy));
            outMat4.setPosition(v.setFromMatrixColumn(inMat4Copy, 3));
            return outMat4;
          };
        })();
        var scene = document.querySelector('a-scene');
        var destination = new THREE.Vector3();
        if (now == 'NOW') {
          scene.systems['hubs-systems'].characterController.teleportTo(destination);
        } else {
          /* object-info-dialog.js */
          try {
            const targetMatrix = new THREE.Matrix4();
            const translation = new THREE.Matrix4();

            var av = Array.from(document.querySelectorAll('[networked-avatar]'))
              .map(function (el) {
                giovanniLog('Z');
                giovanniLog(el.id);
                if (el.id.substr(0, 4) == 'naf-') {
                  return NAF.utils.getNetworkedEntity(el);
                } else {
                  return Promise.resolve(false);
                }
              });
            giovanniLog('Y');
            Promise.all(av).then(function (avatars) {
              giovanniLog('X');
              avatars = avatars
                .filter(function (targetEl) {
                  if (!targetEl) {
                    return false;
                  }
                  giovanniLog('A');
                  var player = NAF.utils.getCreator(targetEl);
                  giovanniLog('B');
                  const playerPresence = APP.hubChannel.presence.state[player];
                  giovanniLog('c');
                  if (playerPresence) {
                    const displayName = playerPresence.metas[0].profile.displayName;
                  giovanniLog('d');

                    return displayName == user;
                  }
                  giovanniLog('e');
                });
              giovanniLog('f');
              if (avatars.length > 0) {
                  giovanniLog('g');
                  var el = avatars[0];
                  NAF.utils.getNetworkedEntity(el).then(targetEl => {
                    el.object3D.updateMatrices();
                    var player = NAF.utils.getCreator(targetEl);
                    //var user = el.querySelector('.nametag');
                    targetMatrix.copy(el.object3D.matrixWorld);
                    affixToWorldUp(targetMatrix, targetMatrix);
                    translation.makeTranslation(0.5, 0, 0.5);
                    targetMatrix.multiply(translation);
                    rotateInPlaceAroundWorldUp(targetMatrix, Math.PI, targetMatrix);

                    scene.systems['hubs-systems'].characterController.enqueueWaypointTravelTo(targetMatrix, false, {
                      willDisableMotion: false,
                      willDisableTeleporting: false,
                      snapToNavMesh: false,
                      willMaintainInitialOrientation: false
                    });

                    giovanniLog('h');
                    const playerPresence = APP.hubChannel.presence.state[player];
                    giovanniLog('i');
                    if (playerPresence) {
                    giovanniLog('j');
                       playerPresence.metas;
                    giovanniLog('j');
                       playerPresence.metas[0];
                    giovanniLog('j');
                       playerPresence.metas[0].profile;
                    giovanniLog('j');
                      const displayName = playerPresence.metas[0].profile.displayName;
                    giovanniLog('k');
                      messageDispatch.dispatch('Went to ' + displayName);
                    } else {
                      messageDispatch.dispatch('Went to [unknown]');
                    }
                  });
                }
            });
          } catch (e) {
            giovanniLog("Interaction error", e.message);
          }
        }
    }, {user, now});
  }

  async send(text) {
    await this.page.evaluate((text) => {
      const messageDispatch = document.getElementById("avatar-rig").messageDispatch;
      if (text.substr(0, 4) == 'MOVE') {
        giovanniMoveToUser(text.substr(5), false);
      } else {
        messageDispatch.dispatch(text);
      }
    }, text);
  }

  sendToRoomId(text, roomID) {
    this.log("No multi-room implementation - sending here");
    this.send(text);
  }

  sendToRoom(text, room) {
    this.sendToRoomId(text, null);
  }

  sendMessage(data) {
  }

  sendDirectToUser(text, name) {
    this.log("No DM implementation - sending here");
  }

  getRoomId(room) {
  }

  callMethod(method, args) {
  }

  useLog(logger) {
    this.log = (text) => logger.info(text);
  }

  login() {
  }

  async connect() {
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--use-fake-ui-for-media-stream',
          '--disable-gpu'
      ]
    });
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    page.on("console", msg => this.log("PAGE: ", msg.text()));
    page.on("error", err => this.log("ERROR: ", err.toString().split("\n")[0]));
    page.on("pageerror", err => this.log("PAGE ERROR: ", err.toString().split("\n")[0]));

    await page.exposeFunction('giovanniLog', message => this.log(message));

    const baseUrl = options["--url"] || `https://${options["--host"]}/hub.html`;

    const params = {
      bot: true,
      allow_multi: true
    };
    const roomOption = options["--room"];
    if (roomOption) {
      params.hub_id = roomOption;
    }

    const url = `${baseUrl}?${querystring.stringify(params)}`;
    this.log(url);

    var log = this.log;
    const navigate = async () => {
      try {
        log("Spawning bot...");
        await page.goto(url);
        await page.evaluate(() => console.log(navigator.userAgent));
        let retryCount = 5;
        let backoff = 1000;
        const loadFiles = async () => {
          try {
            // Interact with the page so that audio can play.
            await page.mouse.click(100, 100);
            if (options["--audio"]) {
              const audioInput = await page.waitForSelector("#bot-audio-input");
              audioInput.uploadFile(options["--audio"]);
              log("Uploaded audio file.");
            }
            if (options["--data"]) {
              const dataInput = await page.waitForSelector("#bot-data-input");
              dataInput.uploadFile(options["--data"]);
              log("Uploaded data file.");
            }
          } catch (e) {
            log("Interaction error", e.message);
            if (retryCount-- < 0) {
              // If retries failed, throw and restart navigation.
              throw new Error("Retries failed");
            }
            log("Retrying...");
            backoff *= 2;
            // Retry interaction to start audio playback
            setTimeout(loadFiles, backoff);
          }
        };

        await loadFiles();

        await page.waitForSelector("[networked-scene]");

        // Do a periodic sanity check of the state of the bots.
        setInterval(async function() {
          let avatarCounts;
          log("INTERVAL");
          try {
            avatarCounts = await page.evaluate(() => ({
              connectionCount: Object.keys(NAF.connection.adapter.occupants).length,
              avatarCount: document.querySelectorAll("[networked-avatar]").length - 1
            }));
            log(JSON.stringify(avatarCounts));
          } catch (e) {
            // Ignore errors. This usually happens when the page is shutting down.
          }
          // Check for more than two connections to allow for a margin where we have a connection but the a-frame
          // entity has not initialized yet.
          if (avatarCounts && avatarCounts.connectionCount > 2 && avatarCounts.avatarCount === 0) {
            // It seems the bots have dog-piled on to a restarting server, so we're going to shut things down and
            // let the hubs-ops bash script restart us.
            log("Detected avatar dog-pile. Restarting.");
            process.exit(1);
          }

        }, 60 * 1000);
      } catch (e) {
        log("Navigation error", e.message);
        setTimeout(navigate, 1000);
      }
    };

    navigate();

    await page.waitForSelector("[networked-scene]");

    this.page = page;
  }
};

module.exports = {
  driver: new HubsDriver(),
  settings: {}
};
