import { LevelIdValidationPipe } from './level-id-validation.pipe';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';

describe('LevelIdValidationPipe', () => {
  let sut: LevelIdValidationPipe;

  beforeEach(() => {
    sut = new LevelIdValidationPipe();
  });

  it.each(['level-01', 'l-007', 'level-99', 'abc123', 'a', 'x-1-2-3'])(
    'passes through a well-formed slug id: %s',
    (id) => {
      expect(sut.transform(id)).toBe(id);
    },
  );

  it.each([
    ['empty', ''],
    ['whitespace', 'level 01'],
    ['uppercase', 'Level-01'],
    ['leading hyphen', '-level'],
    ['trailing hyphen', 'level-'],
    ['double hyphen', 'level--01'],
    ['sql injection', "level-01'; DROP TABLE levels;--"],
    ['path traversal', '../../etc/passwd'],
    ['underscore', 'level_01'],
  ])('rejects a %s id with InvalidLevelIdException', (_label, id) => {
    expect(() => sut.transform(id)).toThrow(InvalidLevelIdException);
  });

  it('rejects an id longer than the max length before it reaches the repository', () => {
    const tooLong = 'l' + '-1'.repeat(40); // > 64 chars
    expect(() => sut.transform(tooLong)).toThrow(InvalidLevelIdException);
  });
});
