import Benchmark from 'benchmark'
import './info.js'
import UTP from '../index.js'

const suite = new Benchmark.Suite
UTP.addSchema('TEST_DATA', [
  { name: 'id', type: 'UINT8' },
  { name: 'type', type: 'ENUM', list: ['ONE', 'TWO'] },
  { name: 'name', type: 'STRING', optional: true },
  { name: 'text', type: 'STRING', optional: true },
])

UTP.addSchema('SPEED_TEST', [
  { name: 'id', type: 'UINT32' },
  { name: 'name', type: 'STRING' },
  // { name: 'data', type: 'ARRAY', items: { type: 'SCHEMA', schema: 'TEST_DATA' } },
])

const TEST_DATA = {
  id: 128,
  type: 'ONE',
  name: 'test 1'
}

const DATA = {
  id: 1,
  name: 'name',
  data: [TEST_DATA]
}

const ENCODED = UTP.encode('TEST_DATA', TEST_DATA)
const JSON_ENCODED = JSON.stringify(TEST_DATA)

suite
  .add('UTP encode', () => {
    UTP.encode('SPEED_TEST', DATA)
  })
  .add('UTP decode', () => {
    UTP.decode(ENCODED)
  })
  .add('JSON encode', () => {
    JSON.stringify(DATA)
  })
  .add('JSON decode', () => {
    JSON.parse(JSON_ENCODED)
  })
  .on('cycle', function (e) {
    console.log('' + e.target)
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run()