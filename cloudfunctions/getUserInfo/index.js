// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data && userRes.data.length > 0) {
      // 用户已存在，返回用户信息
      return {
        success: true,
        user: userRes.data[0]
      }
    } else {
      // 用户不存在，创建新用户
      const addRes = await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: '',
          avatarUrl: '',
          role: 'user',
          createTime: new Date(),
          updateTime: new Date()
        }
      })

      // 获取新创建的用户信息
      const newUser = await db.collection('users').doc(addRes._id).get()
      
      return {
        success: true,
        user: newUser.data
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err
    }
  }
}
