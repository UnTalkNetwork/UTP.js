import os from 'os'

const cpus = os.cpus().map(cpu => cpu.model).reduce((list, model) => {
  if (!list[model]) list[model] = 0
  list[model]++
  return list
}, {})

const INFO = [
  ['--------------------------------------------'],
  ['System info'],
  ['--------------------------------------------'],
  ['OS       ',os.type(), os.release(), os.arch()],
  ['Node.JS  ', process.versions.node],
  ['V8       ', process.versions.v8],
  ['CPUs     ', Object.keys(cpus).map(key => `${key} x ${cpus[key]}`).join(' & ')],
  ['--------------------------------------------']
]

INFO.forEach(line => {
  console.log(line.join(' '))
})