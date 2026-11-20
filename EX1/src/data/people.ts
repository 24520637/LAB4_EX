import type { Person } from '../domain/people'

export const people: readonly Person[] = Object.freeze(
  [
    {
      id: 'ada-lovelace',
      name: 'Ada Lovelace',
      era: '19th century',
      field: 'Mathematics and early computing',
      summary: 'Lovelace explained how Charles Babbage’s proposed Analytical Engine could follow instructions and work with more than numbers.',
      contributions: [
        'Published an annotated translation of a description of the Analytical Engine.',
        'Described a procedure for calculating Bernoulli numbers with the engine.',
      ],
    },
    {
      id: 'alan-turing',
      name: 'Alan Turing',
      era: '20th century',
      field: 'Computability and cryptanalysis',
      summary: 'Turing developed a mathematical model of computation and worked on wartime codebreaking at Bletchley Park.',
      contributions: [
        'Described a universal computing machine in his work on computable numbers.',
        'Proposed the imitation game in his paper on machine intelligence.',
      ],
    },
    {
      id: 'grace-hopper',
      name: 'Grace Hopper',
      era: '20th century',
      field: 'Compilers and programming languages',
      summary: 'Hopper helped make programming more accessible by developing early tools that translated instructions for computers.',
      contributions: [
        'Developed the A-0 programming system for UNIVAC.',
        'Led work on FLOW-MATIC, which used English-like statements for business data processing.',
      ],
    },
    {
      id: 'margaret-hamilton',
      name: 'Margaret Hamilton',
      era: '20th century',
      field: 'Flight software and software engineering',
      summary: 'Hamilton led the MIT team that developed onboard flight software for NASA’s Apollo missions.',
      contributions: [
        'Led software development for the Apollo command and lunar modules.',
        'Helped develop flight software that prioritized critical tasks during overloads.',
      ],
    },
    {
      id: 'donald-knuth',
      name: 'Donald Knuth',
      era: '20th–21st centuries',
      field: 'Algorithms and digital typography',
      summary: 'Knuth documented and analyzed algorithms and developed tools for high-quality digital typesetting.',
      contributions: [
        'Authored The Art of Computer Programming.',
        'Created the TeX typesetting system.',
      ],
    },
    {
      id: 'radia-perlman',
      name: 'Radia Perlman',
      era: '20th–21st centuries',
      field: 'Computer networking',
      summary: 'Perlman designed network protocols that help Ethernet and other networks operate reliably at scale.',
      contributions: [
        'Designed a spanning tree algorithm to prevent forwarding loops in bridged networks.',
        'Designed TRILL to make better use of available paths in Ethernet networks.',
      ],
    },
  ].map((person) =>
    Object.freeze({
      ...person,
      contributions: Object.freeze(person.contributions),
    }),
  ),
)

export function getPersonById(id: string): Person | undefined {
  return people.find((person) => person.id === id)
}

export function searchPeople(query: string): readonly Person[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery === '') {
    return people
  }

  return people.filter((person) => person.name.toLowerCase().includes(normalizedQuery))
}
