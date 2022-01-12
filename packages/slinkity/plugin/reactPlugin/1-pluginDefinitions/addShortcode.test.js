const { argsArrayToPropsObj } = require('./addShortcode')
const { random, datatype } = require('faker')
const logger = require('../../../utils/logger')

jest.mock('../../../utils/logger')

describe('argsArrayToPropsObj', () => {
  it('should generate an empty object for empty arrays', () => {
    expect(argsArrayToPropsObj({ vargs: [] })).toEqual({})
  })
  it('should generate a props object for primitives', () => {
    const expected = {
      [random.word()]: datatype.number(),
      [random.word()]: random.word(),
    }
    const vargs = Object.entries(expected).flat()

    expect(argsArrayToPropsObj({ vargs })).toEqual(expected)
  })
  it('should generate a props object for nested objects', () => {
    const expected = {
      [random.word()]: {
        [random.word()]: datatype.number(),
        [random.word()]: [random.words(), random.words()],
      },
      [random.word()]: random.word(),
    }
    const vargs = Object.entries(expected).flat()

    expect(argsArrayToPropsObj({ vargs })).toEqual(expected)
  })
  it('should log a warning for invalid props array', () => {
    const vargs = ['all work', 'and no play', 'makes Jack']
    const spy = jest.spyOn(logger, 'log')
    const errorMsg = 'Uh oh! We made a boo boo'

    expect(argsArrayToPropsObj({ vargs, errorMsg })).toEqual({})
    expect(spy).toHaveBeenCalledWith({ message: errorMsg, type: 'warning' })
  })
  it('should return empty object when no params are passed', () => {
    expect(argsArrayToPropsObj({})).toEqual({})
  })
})
