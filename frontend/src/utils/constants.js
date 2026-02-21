export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/users/register',
  USERS: '/users/all',
  PROFILE: '/users/profile',
  HEALTH: '/health',
};

export const APP_CONSTANTS = {
  APP_NAME: import.meta.env.VITE_APP_NAME || 'MERN Registration App',
  MAX_IMAGE_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_DOC_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
};

// Enhanced country information with real-world validation data
export const MOBILE_COUNTRIES = [
  {
    code: '+1',
    name: 'USA/Canada',
    flag: '🇺🇸',
    digits: 10,
    pattern: 'NXX-NXX-XXXX (N=2-9, X=0-9)',
    example: '212-555-1234',
    isoCode: 'US'
  },
  {
    code: '+44',
    name: 'United Kingdom',
    flag: '🇬🇧',
    digits: 10,
    pattern: '7XXX XXX XXX',
    example: '7123 456789',
    isoCode: 'GB'
  },
  {
    code: '+91',
    name: 'India',
    flag: '🇮🇳',
    digits: 10,
    pattern: '6-9XX-XXX-XXXX',
    example: '9876543210',
    isoCode: 'IN'
  },
  {
    code: '+61',
    name: 'Australia',
    flag: '🇦🇺',
    digits: 9,
    pattern: 'X XXX XXX XXX',
    example: '412 345 678',
    isoCode: 'AU'
  },
  {
    code: '+49',
    name: 'Germany',
    flag: '🇩🇪',
    digits: '10-11',
    pattern: '15XX XXXXXXX',
    example: '1512 3456789',
    isoCode: 'DE'
  },
  {
    code: '+33',
    name: 'France',
    flag: '🇫🇷',
    digits: 9,
    pattern: '6 XX XX XX XX',
    example: '6 12 34 56 78',
    isoCode: 'FR'
  },
  {
    code: '+81',
    name: 'Japan',
    flag: '🇯🇵',
    digits: '10-11',
    pattern: '90-XXXX-XXXX',
    example: '90-1234-5678',
    isoCode: 'JP'
  },
  {
    code: '+86',
    name: 'China',
    flag: '🇨🇳',
    digits: 11,
    pattern: '13X XXXX XXXX',
    example: '138 0013 8000',
    isoCode: 'CN'
  },
];

export const DATE_FORMAT = {
  DISPLAY: 'dd-MMM-yyyy',
  API: 'yyyy-MM-dd',
  INPUT: 'yyyy-MM-dd',
  MANUAL: ['dd/MM/yyyy', 'dd-MM-yyyy', 'dd.MM.yyyy', 'dd/MMM/yyyy', 'dd-MMM-yyyy']
};

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_LOWERCASE: true,
  REQUIRE_UPPERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  BLOCK_COMMON_PASSWORDS: true,
  BLOCK_SEQUENCES: true,
  BLOCK_KEYBOARD_PATTERNS: true,
};

export const COUNTRY_VALIDATION_RULES = {
  '+1': {
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    areaCodes: [
      '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218',
      '219', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260',
      '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307',
      '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '326',
      '327', '330', '331', '332', '334', '336', '337', '339', '340', '341', '346', '347', '351', '352', '360', '361',
      '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414',
      '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '448',
      '458', '463', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508',
      '509', '510', '512', '513', '515', '516', '517', '518', '520', '530', '531', '534', '539', '540', '541', '551',
      '557', '559', '561', '562', '563', '564', '567', '570', '571', '573', '574', '575', '580', '585', '586', '601',
      '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620',
      '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '657', '659', '660', '661',
      '662', '667', '669', '670', '671', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704',
      '706', '707', '708', '712', '713', '714', '715', '716', '717', '718', '719', '720', '724', '725', '726', '727',
      '728', '730', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769',
      '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806',
      '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '838',
      '839', '840', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864',
      '865', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915',
      '916', '917', '918', '919', '920', '925', '927', '928', '929', '930', '931', '934', '936', '937', '938', '939',
      '940', '941', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979',
      '980', '984', '985', '986', '989'
    ]
  },
  '+44': {
    pattern: /^7[1-9]\d{8}$/,
    areaCodes: [
      '20', '23', '24', '28', '29', '113', '114', '115', '116', '117', '118', '121', '131', '141', '151', '161',
      '191', '203', '207', '208', '209', '300', '303', '306', '309', '330', '333', '336', '339', '350', '353',
      '356', '359', '370', '373', '376', '379', '380', '383', '386', '389', '400', '403', '406', '409', '430',
      '433', '436', '439', '450', '453', '456', '459', '470', '473', '476', '479', '500', '503', '506', '509',
      '530', '533', '536', '539', '560', '563', '566', '569', '580', '583', '586', '589'
    ]
  },
  '+91': {
    pattern: /^[6-9]\d{9}$/,
    operators: {
      '6': ['Airtel', 'Vodafone Idea', 'Reliance Jio'],
      '7': ['Airtel', 'Vodafone Idea', 'Reliance Jio', 'BSNL'],
      '8': ['Airtel', 'Vodafone Idea', 'Reliance Jio'],
      '9': ['Airtel', 'Vodafone Idea', 'Reliance Jio', 'BSNL']
    }
  },
  '+86': {
    pattern: /^1[3-9]\d{9}$/,
    operators: {
      '13': 'China Mobile',
      '14': 'China Unicom',
      '15': 'China Telecom',
      '16': 'China Unicom',
      '17': 'China Telecom',
      '18': 'China Mobile',
      '19': 'China Unicom'
    }
  }
};

// Phone number formatting examples by country
export const PHONE_EXAMPLES = {
  '+1': {
    format: '(XXX) XXX-XXXX',
    example: '(212) 555-1234',
    note: 'Area code cannot start with 0 or 1'
  },
  '+44': {
    format: '7XXX XXX XXX',
    example: '7123 456789',
    note: 'Must start with 7 followed by 1-9'
  },
  '+91': {
    format: 'XXXXX-XXXXX',
    example: '98765-43210',
    note: 'Must start with 6, 7, 8, or 9'
  },
  '+61': {
    format: 'X XXX XXX XXX',
    example: '4 12 345 678',
    note: '9 digits, cannot start with 0'
  },
  '+49': {
    format: 'XXX XXXXXXXX',
    example: '151 23456789',
    note: '10-11 digits, cannot start with 0'
  },
  '+33': {
    format: 'X XX XX XX XX',
    example: '6 12 34 56 78',
    note: '9 digits, cannot start with 0'
  },
  '+81': {
    format: 'XX-XXXX-XXXX',
    example: '90-1234-5678',
    note: '10-11 digits, starts with 7-9'
  },
  '+86': {
    format: 'XXX XXXX XXXX',
    example: '138 0013 8000',
    note: '11 digits, starts with 13-19'
  }
};

// Degree → Specialization mapping
export const DEGREE_SPECIALIZATIONS = {
  // Bachelor's (Graduation) degrees
  'Bachelor Technology / Bachelor Engineering': [
    'Computer Science Engineering (CSE)',
    'Information Technology (IT)',
    'Artificial Intelligence & Machine Learning',
    'Data Science',
    'Cyber Security',
    'Cloud Computing'
  ],
  'Bachelor of Computer Applications (BCA)': [
    'Data Science',
    'Artificial Intelligence (AI)',
    'Machine Learning (ML)',
    'Cyber Security',
    'Cloud Computing',
    'Web Development'
  ],
  'Bachelor of Science': [
    'Computer Science',
    'Information Technology',
    'Data Analytics',
    'Artificial Intelligence',
    'Machine Learning',
    'Cyber Security',
    'Cloud Computing'
  ],

  // Master's (Qualifying Degree) degrees
  'Master of Technology / Master of Engineering (M.Tech / M.E.)': [
    'Computer Science Engineering (CSE)',
    'Information Technology (IT)',
    'Artificial Intelligence & Machine Learning',
    'Data Science',
    'Cyber Security',
    'Cloud Computing',
    'Software Engineering',
    'Computer Engineering'
  ],
  'Master of Computer Applications (MCA)': [
    'Data Science',
    'Artificial Intelligence (AI)',
    'Machine Learning (ML)',
    'Cyber Security',
    'Cloud Computing',
    'Web Development'
  ],
  'Master of Science (M.Sc.)': [
    'Computer Science',
    'Information Technology',
    'Data Analytics',
    'Artificial Intelligence',
    'Machine Learning',
    'Cyber Security',
    'Cloud Computing'
  ]
};