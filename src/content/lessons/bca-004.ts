import type { Lesson } from "./types";

const generations: Lesson = {
  intro: "Computer generations mark major technological transitions in computing hardware, switching devices, memory, and software. Exam questions frequently ask you to compare the 1st through 5th generations across core switching technology, primary memory, secondary storage, programming languages, and key examples. You will learn the definitive timeline, architecture shifts, and comparison table.",
  sections: [
    {
      h: "The Five Computer Generations",
      p: [
        "First Generation (1940–1956): Powered by Vacuum Tubes. Relied on magnetic drums for memory, consumed massive power, generated intense heat, and were programmed strictly in machine language. Examples: ENIAC, EDVAC, UNIVAC I.",
        "Second Generation (1956–1963): Replaced vacuum tubes with Transistors (invented at Bell Labs). Used magnetic core primary memory and magnetic tapes/disks for secondary storage. Introduced early assembly and high-level languages like FORTRAN, COBOL. Examples: IBM 1401, CDC 1604.",
        "Third Generation (1964–1971): Built using Integrated Circuits (ICs) combining multiple transistors onto a single silicon chip (SSI and MSI). Introduced keyboards, monitors, operating systems, and time-sharing. Examples: IBM System/360, PDP-8.",
        "Fourth Generation (1971–Present): Powered by Microprocessors using Very Large Scale Integration (VLSI) and Ultra Large Scale Integration (ULSI) packing millions of transistors onto a single CPU die. Brought personal computers (PCs), networking, the Internet, and modern C/C++/Java/Python languages.",
        "Fifth Generation (Present & Beyond): Focuses on Artificial Intelligence (AI), parallel processing, quantum computing, natural language processing (NLP), and neural networks."
      ],
      formula: [
        "1st Gen: Vacuum Tubes | Magnetic Drums | Machine Lang | ENIAC",
        "2nd Gen: Transistors | Magnetic Cores | Assembly/FORTRAN | IBM 1401",
        "3rd Gen: Integrated Circuits (ICs) | Semiconductor RAM | OS/Time-sharing | IBM 360",
        "4th Gen: VLSI / Microprocessors | Semiconductor/Flash | High-Level/C/Java | PCs",
        "5th Gen: ULSI / AI / Quantum | Parallel Architecture | Natural Language / AI"
      ]
    },
    {
      h: "Key Comparison Dimensions for Exams",
      p: [
        "Size and Speed: Transitioned from entire rooms (kilohertz clock rates) down to handheld nanometer silicon (gigahertz multi-core).",
        "Reliability and Power: First generation tubes burnt out frequently (MTBF of hours); modern solid-state VLSI processors run continuously for decades with negligible power consumption."
      ]
    }
  ],
  examples: [
    {
      q: "Compare Second and Third Generation computers with respect to switching device, storage media, and human interface.",
      steps: [
        "Switching device: 2nd Gen used discrete transistors; 3rd Gen used Integrated Circuits (ICs).",
        "Memory/Storage: 2nd Gen used magnetic core memory + magnetic tapes; 3rd Gen used magnetic core/semiconductor RAM + magnetic disk packs.",
        "Human Interface: 2nd Gen used punched cards and batch printouts; 3rd Gen introduced interactive monitors and keyboards via time-sharing OS."
      ],
      ans: "2nd Gen: Transistors, magnetic cores, punched cards. 3rd Gen: ICs, semiconductor memory, keyboards/monitors."
    },
    {
      q: "Why was the invention of the microprocessor (Intel 4004 in 1971) considered the defining turning point of the 4th generation?",
      steps: [
        "Prior to VLSI, the ALU, control unit, and registers resided on separate IC chips.",
        "The microprocessor integrated the entire CPU onto a single silicon chip.",
        "This enabled compact, low-cost microcomputers and personal computers (PCs)."
      ],
      ans: "It consolidated the entire central processing unit onto a single silicon chip, enabling the personal computer revolution."
    }
  ],
  mistakes: [
    "Stating that transistors were used in the 1st generation. 1st gen used vacuum tubes; transistors belong to 2nd gen.",
    "Confusing VLSI (4th generation) with ICs (3rd generation).",
    "Forgetting to mention the shift in user interfaces: punched cards -> keyboards/monitors -> GUIs -> voice/touch."
  ],
  check: [
    { q: "The primary switching component of 1st generation computers was", o: ["Transistor", "Vacuum Tube", "Integrated Circuit", "Microprocessor"], a: 1, why: "1st gen computers used thermionic vacuum tubes." },
    { q: "Integrated circuits (ICs) were first introduced in which generation?", o: ["1st", "2nd", "3rd", "4th"], a: 2, why: "3rd generation introduced SSI and MSI integrated circuits." },
    { q: "VLSI and ULSI technology is the hallmark of which generation?", o: ["2nd", "3rd", "4th", "1st"], a: 2, why: "4th generation computers utilize VLSI/ULSI microprocessors." },
    { q: "Which programming language was first used in 1st generation machines?", o: ["Machine Language", "C", "FORTRAN", "Java"], a: 0, why: "1st generation computers were programmed directly in raw binary machine language." }
  ]
};

const storageFundamentals: Lesson = {
  intro: "Computer memory forms a hierarchical pyramid balancing speed, capacity, and cost per bit. Examination questions test primary memory (RAM vs ROM variants) versus secondary storage (magnetic, optical, and solid-state media). You will master access mechanisms, volatility, cycle times, and media trade-offs.",
  sections: [
    {
      h: "Primary Memory: RAM vs ROM",
      p: [
        "RAM (Random Access Memory): Volatile read-write memory where access time is uniform regardless of physical cell location. Subdivided into SRAM (Static RAM, using 6-transistor flip-flops, faster, used for cache, no refresh) and DRAM (Dynamic RAM, using 1 transistor + 1 capacitor, requires periodic electrical refreshing, denser and cheaper, used for main system memory).",
        "ROM (Read Only Memory): Non-volatile memory holding firmware and BIOS/UEFI boot code. Variants include PROM (Programmable ROM, written once by high voltage fuse blowing), EPROM (Erasable PROM, erased via ultraviolet light through a quartz window), and EEPROM/Flash (Electrically Erasable PROM, erased and written in byte/block sectors electrically)."
      ],
      formula: [
        "SRAM: 6-transistor latch | No refresh | Very fast (1-5 ns) | Cache memory",
        "DRAM: 1T + 1C cell | Periodic refresh needed | Moderate speed (10-50 ns) | Main RAM",
        "ROM Hierarchy: Mask ROM -> PROM (OTP) -> EPROM (UV erase) -> EEPROM / Flash (Electrical)"
      ]
    },
    {
      h: "Secondary Storage Media",
      p: [
        "Magnetic Media: Hard Disk Drives (HDDs) use spinning magnetic platters with read/write heads (Seek Time + Rotational Latency + Transfer Time).",
        "Optical Media: CDs (700 MB, 780 nm infrared), DVDs (4.7 GB, 650 nm red laser), and Blu-Ray (25–50 GB, 405 nm blue-violet laser) store bits as microscopic pits and lands etched on polycarbonate substrates.",
        "Solid-State Media: SSDs and USB Flash drives use NAND flash memory cells with floating-gate or charge-trap transistors, offering zero mechanical seek latency, high IOPS, and shock resistance."
      ]
    }
  ],
  examples: [
    {
      q: "Differentiate between SRAM and DRAM with respect to construction, speed, refresh requirement, and application.",
      steps: [
        "Construction: SRAM uses 4 to 6 transistors forming a bistable latch; DRAM uses 1 transistor and 1 storage capacitor.",
        "Speed: SRAM access time is 0.5–5 ns; DRAM access time is 10–50 ns.",
        "Refresh: SRAM retains state as long as power is on (no refresh); DRAM loses capacitor charge and requires refreshing thousands of times per second.",
        "Application: SRAM is used for L1/L2/L3 CPU cache; DRAM is used for computer main memory."
      ],
      ans: "SRAM: 6T latch, no refresh, high speed, cache memory. DRAM: 1T+1C, periodic refresh, high density, main system RAM."
    },
    {
      q: "Explain how Blu-Ray achieves higher data capacity (25 GB) compared to standard DVD (4.7 GB) on the same 12 cm physical disc.",
      steps: [
        "Blu-Ray uses a shorter blue-violet laser wavelength (405 nm) compared to DVD red laser (650 nm).",
        "Shorter wavelength allows a tighter focal spot (Airy disk diameter is proportional to wavelength / NA).",
        "Blu-Ray increases the Numerical Aperture (NA) to 0.85 (vs 0.60 in DVD), enabling narrower track pitch (0.32 um vs 0.74 um) and tighter pit spacing."
      ],
      ans: "Shorter 405 nm blue laser wavelength and higher numerical aperture allow much smaller pits and tighter track pitch."
    }
  ],
  mistakes: [
    "Assuming ROM is completely unchangeable under any circumstance; EEPROM and Flash are electrically reprogrammable.",
    "Confusing seek time (moving head to track) with rotational latency (waiting for sector to rotate under head).",
    "Believing SRAM is cheaper than DRAM. SRAM takes 6x the silicon area per bit, making it significantly more expensive."
  ],
  check: [
    { q: "Which memory requires periodic electrical refreshing to retain data?", o: ["SRAM", "DRAM", "EEPROM", "Mask ROM"], a: 1, why: "DRAM stores bits in leaky capacitors that must be refreshed periodically." },
    { q: "EPROM contents are erased by exposing the chip to", o: ["Electric current", "Ultraviolet (UV) radiation", "Magnetic field", "Infrared laser"], a: 1, why: "EPROMs have a quartz window through which UV light discharges floating gates." },
    { q: "The laser wavelength used in Blu-Ray disc systems is", o: ["780 nm (Infrared)", "650 nm (Red)", "405 nm (Blue-Violet)", "532 nm (Green)"], a: 2, why: "Blu-Ray uses a 405 nm blue-violet semiconductor laser." },
    { q: "Total HDD access time is the sum of", o: ["Seek time + Rotational latency + Transfer time", "Clock time + Bus delay", "RAM latency + Cache hit time", "Bandwidth / Frequency"], a: 0, why: "Total HDD access time includes seek time, rotational delay, and data transfer time." }
  ]
};

const numberSystems: Lesson = {
  intro: "Computer arithmetic operates in binary, octal, decimal, and hexadecimal radices. Examination questions require exact radix conversions, binary addition/subtraction, and 1's and 2's complement representation of signed integers. You will learn foolproof division-remainder and multiply-fraction algorithms, and complement arithmetic.",
  sections: [
    {
      h: "Positional Number Systems",
      p: [
        "A number in base r has digits 0 to r − 1. Its value is given by Σ (d_i × r^i).",
        "Binary (r = 2, digits 0, 1), Octal (r = 8, digits 0–7), Decimal (r = 10, digits 0–9), Hexadecimal (r = 16, digits 0–9, A–F where A=10, B=11, C=12, D=13, E=14, F=15).",
        "Conversions between Binary and Octal/Hexadecimal are performed by grouping bits into groups of 3 (for octal) or 4 (for hex) starting from the binary point."
      ],
      formula: [
        "Octal <-> Binary: 1 Octal digit = exactly 3 Binary bits (e.g. 7_8 = 111_2)",
        "Hex <-> Binary: 1 Hex digit = exactly 4 Binary bits (e.g. F_16 = 1111_2)",
        "Decimal -> Base r: Successive division by r (remainders bottom-to-top)",
        "Fraction -> Base r: Successive multiplication by r (integer parts top-to-bottom)"
      ]
    },
    {
      h: "1's and 2's Complement Signed Arithmetic",
      p: [
        "1's Complement: Invert every bit (0 -> 1, 1 -> 0). Has two representations for zero (+0 and -0).",
        "2's Complement: Take 1's complement and add 1. Range for n bits is −2^(n−1) to +2^(n−1) − 1. It has a single unique zero, and subtraction A − B is implemented directly as A + (2's complement of B). If an end carry occurs when adding two n-bit numbers in 2's complement, it is discarded."
      ],
      formula: [
        "1's Complement of X = bitwise NOT(X)",
        "2's Complement of X = NOT(X) + 1",
        "Subtraction: A - B = A + [2's comp of B]; discard final end carry"
      ]
    }
  ],
  examples: [
    {
      q: "Convert (1011011.101)_2 to Hexadecimal and Octal.",
      steps: [
        "For Octal: Group in 3s from the point: (001)(011)(011).(101) = 133.5_8.",
        "For Hexadecimal: Group in 4s from the point: (0101)(1011).(1010) = 5B.A_16."
      ],
      ans: "Octal = (133.5)_8, Hexadecimal = (5B.A)_16"
    },
    {
      q: "Perform (28)_10 − (13)_10 using 8-bit 2's complement arithmetic.",
      steps: [
        "+28 in 8 bits = 00011100.",
        "+13 in 8 bits = 00001101.",
        "2's complement of 13: NOT(00001101) = 11110010; add 1 -> 11110011 (−13).",
        "Add: 00011100 + 11110011 = (1) 00001111.",
        "Discard the end-around carry (1). Remaining 8 bits = 00001111 = +15_10."
      ],
      ans: "00001111_2 = +15_10"
    }
  ],
  mistakes: [
    "Grouping hex bits from the left for fractions instead of from the radix point outward.",
    "Forgetting to add 1 when finding the 2's complement after bit inversion.",
    "Adding the end carry back to the result in 2's complement (that is done only in 1's complement end-around carry)."
  ],
  check: [
    { q: "The hexadecimal representation of binary (1101111010101101)_2 is", o: ["DEAD", "BEEF", "CAFE", "FEED"], a: 0, why: "1101=D, 1110=E, 1010=A, 1101=D -> DEAD." },
    { q: "In an 8-bit 2's complement system, what decimal value does 11111111 represent?", o: ["+255", "−1", "−127", "−128"], a: 1, why: "2's complement of 11111111 is 00000000 + 1 = 1, with negative sign -> -1." },
    { q: "What is the 2's complement of 01010100?", o: ["10101011", "10101100", "01010101", "11010100"], a: 1, why: "Invert: 10101011; Add 1: 10101100." },
    { q: "How many octal digits are represented by 12 binary bits?", o: ["3", "4", "6", "2"], a: 1, why: "Each octal digit requires 3 bits. 12 / 3 = 4 octal digits." }
  ],
  lab: { id: "dlcodes", label: "Open the Number Systems & Codes Lab" }
};

export const L_BCA004: Record<string, Lesson> = {
  "BCA-004:1:5": generations,
  "BCA-004:3:1": storageFundamentals,
  "BCA-004:5:1": numberSystems,
};
