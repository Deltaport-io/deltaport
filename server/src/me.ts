import models from './models'
const crypto = require('crypto')

export const isMeLogged = (token = '') => {
  return new Promise(function (resolve, reject) {
    models.sessions.findOne({ where: { token } }).then(function (session) {
      if (!session) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export const getMeUser = (token = '') => {
  return new Promise<any>(function (resolve, reject) {
    models.users.findOne({
      include: [{
        model: models.sessions,
        where: { token }
      }]
    }).then(function (user) {
      if (!user) {
        resolve(false)
      } else {
        resolve(user)
      }
    })
  })
}

export const signMeUp = (email, password) => {
  return new Promise<any>(function (resolve, reject) {
    models.users.create({ email: email, password: passHashGen(password) }).then(function (user) {
      createSession(user.idusers).then(function (token) {
        const returnUser = { idusers: user.idusers, email: user.email, createdAt: user.createdAt }
        resolve({ status: 'success', token, user: returnUser })
      })
    }).catch(function (err) {
      resolve({ status: 'error', message: 'Error creating user.' })
    })
  })
}

export const logMeIn = (email, password) => {
  return new Promise<any>(function (resolve, reject) {
    models.users.findOne({ where: { email } }).then(function (user) {
      if (!user) {
        resolve({ status: 'error', message: 'No account found.' })
      } else {
        if (passHashCompare(password, user.password) === false) {
          resolve({ status: 'error', message: 'Wrong password.' })
        } else {
          createSession(user.idusers).then(function (token) {
            const returnUser = { idusers: user.idusers, email: user.email, createdAt: user.createdAt }
            resolve({ status: 'success', token, user: returnUser })
          })
        }
      }
    })
  })
}

export const requestResetPassword = (email) => {
  return new Promise<any>(function (resolve, reject) {
    models.users.findOne({
      where: { email }
    }).then(function (user) {
      if (!user) {
        resolve(false)
      } else {
        const uid = crypto.randomBytes(48).toString('base64').replace('/', '').replace('+', '')
        models.passreset.create({ uid: uid, userIdusers: user.idusers }).then(function (passreset) {
          // console.log('passreset:', passreset.uid)
          resolve(true)
        })
      }
    })
  })
}

export const requestUpdatePassword = (uid, password) => {
  return new Promise<any>(function (resolve) {
    models.users.findOne({
      include: [{
        model: models.passreset,
        where: { uid }
      }]
    }).then(function (user) {
      if (!user) {
        resolve(false)
      } else {
        user.password = passHashGen(password)
        user.save().then(function (user) {
          models.passreset.destroy({ where: { uid } }).then(function () {
            resolve(true)
          })
        })
      }
    })
  })
}

const createSession = (userid) => {
  const token = (new Date().getTime()).toString(16) + '.' + crypto.randomBytes(48).toString('base64')
  return new Promise(function (resolve, reject) {
    models.sessions.create({ token, userIdusers: userid }).then(function (sessions) {
      resolve(sessions.token)
    })
  })
}

const passHashGen = (password) => {
  const salt = crypto.randomBytes(64).toString('base64')
  const hash = crypto.createHmac('sha512', salt)
  hash.update(password)
  const passwordHash = hash.digest('base64')
  return salt + '.' + passwordHash
}

const passHashCompare = (password, hash) => {
  const splited = hash.split('.')
  const hasher = crypto.createHmac('sha512', splited[0])
  hasher.update(password)
  const passwordHash = hasher.digest('base64')
  if (passwordHash === splited[1]) {
    return true
  } else {
    return false
  }
}
