const soReminderRepo = require("../repositories/soReminderRepository")

exports.createSOReminder = (data) => {
  return soReminderRepo.createSOReminder(data)
}

exports.getSORemindersBySoId = (soId) => {
  return soReminderRepo.getSORemindersBySoId(soId)
}

exports.getSoIdByReminderId = (reminderId) => {
  return soReminderRepo.getSoIdByReminderId(reminderId)
}

exports.deleteSORemindersBySoId = (soId) => {
  return soReminderRepo.deleteSORemindersBySoId(soId)
}
