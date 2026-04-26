import json
import random

data = {
  'quizzes': {},
  'resources': {},
  'internships': [],
  'recommendations': []
}

# --- IMPROVED QUIZZES ---
skills = ['python', 'javascript', 'java', 'cpp', 'react', 'node', 'sql', 'machine-learning', 'aws', 'docker', 'css', 'html', 'go', 'rust']
difficulties = ['beginner', 'intermediate', 'advanced']
pools = {
    'python': [
        {'q': 'Which of the following is an anonymous function in Python?', 'options': ['def', 'lambda', 'func', 'inline'], 'answer': 1},
        {'q': 'What is the output of 3 * 1 ** 3?', 'options': ['27', '9', '3', '1'], 'answer': 2},
        {'q': 'Which keyword is used for handling exceptions?', 'options': ['catch', 'except', 'try', 'throw'], 'answer': 1},
        {'q': 'What data structure is defined by using square brackets []?', 'options': ['Tuple', 'Set', 'List', 'Dictionary'], 'answer': 2},
        {'q': 'How do you insert an element at the end of a list?', 'options': ['insert()', 'push()', 'add()', 'append()'], 'answer': 3},
        {'q': 'Which statement terminates the current loop?', 'options': ['continue', 'break', 'stop', 'exit'], 'answer': 1},
        {'q': 'What is the default return value of a function without a return statement?', 'options': ['0', 'None', 'False', 'null'], 'answer': 1},
        {'q': 'Which module is used for generating random numbers?', 'options': ['math', 'random', 'os', 'sys'], 'answer': 1},
        {'q': 'How do you start a multiline comment in Python?', 'options': ['/* ... */', '// ...', '""" ... """', '# ...'], 'answer': 2},
        {'q': 'What is used to map keys to values in Python?', 'options': ['Array', 'Dictionary', 'Queue', 'List'], 'answer': 1}
    ],
    'javascript': [
        {'q': 'What will `typeof null` return?', 'options': ['"null"', '"object"', '"undefined"', '"string"'], 'answer': 1},
        {'q': 'Which operator is used to compare both value and type?', 'options': ['==', '===', '=', '!='], 'answer': 1},
        {'q': 'How do you declare a constant variable in JS?', 'options': ['var', 'let', 'const', 'constant'], 'answer': 2},
        {'q': 'What is the output of `"2" + 2`?', 'options': ['4', '"22"', 'NaN', 'Error'], 'answer': 1},
        {'q': 'Which method removes the last element from an array?', 'options': ['pop()', 'shift()', 'splice()', 'remove()'], 'answer': 0},
        {'q': 'How can you log a message to the console?', 'options': ['print()', 'log()', 'console.log()', 'System.out.print()'], 'answer': 2},
        {'q': 'Which of the following is a JS framework?', 'options': ['Django', 'Laravel', 'React', 'Flask'], 'answer': 2},
        {'q': 'What does DOM stand for?', 'options': ['Data Object Model', 'Document Object Model', 'Design Object Model', 'None'], 'answer': 1},
        {'q': 'Which event occurs when the user clicks on an HTML element?', 'options': ['onmouseover', 'onchange', 'onclick', 'onmouseclick'], 'answer': 2},
        {'q': 'What is the correct syntax to create an arrow function?', 'options': ['() => {}', 'function() => {}', '() -> {}', 'None'], 'answer': 0}
    ],
    'java': [
        {'q': 'Which data type is used to create a single character in Java?', 'options': ['String', 'char', 'Character', 'chr'], 'answer': 1},
        {'q': 'What is the size of an int in Java?', 'options': ['16-bit', '32-bit', '64-bit', '8-bit'], 'answer': 1},
        {'q': 'Which keyword is used to inherit a class in Java?', 'options': ['implements', 'inherits', 'extends', 'base'], 'answer': 2},
        {'q': 'What is the default value of a boolean variable in Java?', 'options': ['true', 'false', 'null', '0'], 'answer': 1},
        {'q': 'Which of these is NOT a Java access modifier?', 'options': ['public', 'protected', 'private', 'internal'], 'answer': 3},
        {'q': 'What is the entry point of a Java program?', 'options': ['main()', 'start()', 'run()', 'init()'], 'answer': 0},
        {'q': 'Which collection does not allow duplicate values?', 'options': ['ArrayList', 'LinkedList', 'HashSet', 'Vector'], 'answer': 2},
        {'q': 'Which keyword creates an object in Java?', 'options': ['create', 'make', 'new', 'instantiate'], 'answer': 2},
        {'q': 'Which class is the root of all Java classes?', 'options': ['Base', 'Object', 'Root', 'System'], 'answer': 1},
        {'q': 'How do you get the length of a string `str` in Java?', 'options': ['str.length()', 'str.size()', 'str.length', 'str.count()'], 'answer': 0}
    ],
    'cpp': [
        {'q': 'Which operator is used to allocate memory dynamically in C++?', 'options': ['malloc', 'calloc', 'new', 'alloc'], 'answer': 2},
        {'q': 'What does STL stand for?', 'options': ['Standard Template Library', 'Simple Template Library', 'Standard Type Library', 'None'], 'answer': 0},
        {'q': 'Which of the following is used for output in C++?', 'options': ['cin', 'cout', 'printf', 'print'], 'answer': 1},
        {'q': 'What does the `virtual` keyword do?', 'options': ['Optimizes code', 'Enables polymorphism', 'Protects data', 'None'], 'answer': 1},
        {'q': 'Which header file is required for `cin` and `cout`?', 'options': ['<stdio.h>', '<iostream>', '<string>', '<stdlib.h>'], 'answer': 1},
        {'q': 'How do you free memory allocated with `new`?', 'options': ['free()', 'release()', 'delete', 'remove'], 'answer': 2},
        {'q': 'What is the size of `char` in C++?', 'options': ['1 byte', '2 bytes', '4 bytes', '8 bytes'], 'answer': 0},
        {'q': 'Which loop is executed at least once?', 'options': ['for', 'while', 'do-while', 'None'], 'answer': 2},
        {'q': 'Which operator accesses a member using an object pointer?', 'options': ['.', '::', '->', '*'], 'answer': 2},
        {'q': 'What does the keyword `break` do?', 'options': ['Exits loop', 'Skips iteration', 'Exits program', 'None'], 'answer': 0}
    ],
    'react': [
        {'q': 'What is the default port for a React app?', 'options': ['8080', '5000', '3000', '8000'], 'answer': 2},
        {'q': 'What hook is used to manage state?', 'options': ['useEffect', 'useContext', 'useState', 'useReducer'], 'answer': 2},
        {'q': 'What is JSX?', 'options': ['JavaScript XML', 'JavaScript Extension', 'Java Syntax', 'None'], 'answer': 0},
        {'q': 'How do you pass data to components?', 'options': ['State', 'Props', 'Params', 'Signals'], 'answer': 1},
        {'q': 'What hook handles side effects?', 'options': ['useState', 'useEffect', 'useRef', 'useMemo'], 'answer': 1},
        {'q': 'What is the virtual DOM?', 'options': ['A backup DOM', 'A lightweight copy of the DOM', 'A faster browser DOM', 'None'], 'answer': 1},
        {'q': 'What is the purpose of keys in lists?', 'options': ['To encrypt items', 'To track component state', 'To identify changes efficiently', 'None'], 'answer': 2},
        {'q': 'How do you access state via hooks?', 'options': ['Directly', 'Using standard getters', 'Using the set function', 'None'], 'answer': 2},
        {'q': 'Which hook stores a mutable reference?', 'options': ['useMemo', 'useRef', 'useCallback', 'useReducer'], 'answer': 1},
        {'q': 'What is a Higher-Order Component?', 'options': ['A stateful component', 'A component that renders another', 'A function that returns a component', 'None'], 'answer': 2}
    ],
    'node': [
        {'q': 'Which module is used to start a web server?', 'options': ['http', 'fs', 'url', 'path'], 'answer': 0},
        {'q': 'How do you import modules in Node.js?', 'options': ['import', 'require', 'include', 'load'], 'answer': 1},
        {'q': 'What executes JavaScript outside the browser?', 'options': ['NPM', 'Node.js runtime', 'V8 engine', 'None'], 'answer': 1},
        {'q': 'What command initializes a package.json?', 'options': ['npm init', 'npm start', 'npm install', 'npm new'], 'answer': 0},
        {'q': 'Which framework is commonly used with Node?', 'options': ['Django', 'Express', 'Flask', 'Spring'], 'answer': 1},
        {'q': 'What is the default file for Node apps?', 'options': ['index.html', 'server.js/index.js', 'main.cpp', 'app.java'], 'answer': 1},
        {'q': 'What does NPM stand for?', 'options': ['Node Package Manager', 'Node Project Maker', 'New Package Manager', 'None'], 'answer': 0},
        {'q': 'Which of these is built-in?', 'options': ['axios', 'lodash', 'path', 'chalk'], 'answer': 2},
        {'q': 'How do you read environment variables?', 'options': ['process.env', 'process.argv', 'os.env', 'env.get()'], 'answer': 0},
        {'q': 'Which statement describes Node.js?', 'options': ['Multi-threaded', 'Synchronous', 'Single-threaded event loop', 'Browser-based'], 'answer': 2}
    ],
    'sql': [
        {'q': 'Which clause filters records after grouping?', 'options': ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], 'answer': 1},
        {'q': 'How do you select all columns from a table?', 'options': ['SELECT ALL', 'SELECT *', 'SELECT columns', 'SELECT * FROM'], 'answer': 1},
        {'q': 'What constraint ensures unique values?', 'options': ['DEFAULT', 'UNIQUE', 'CHECK', 'NOT NULL'], 'answer': 1},
        {'q': 'Which join returns records with matches in both tables?', 'options': ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], 'answer': 2},
        {'q': 'What keyword sorts results?', 'options': ['SORT', 'ORDER BY', 'GROUP BY', 'FILTER'], 'answer': 1},
        {'q': 'How do you remove a table?', 'options': ['DELETE TABLE', 'DROP TABLE', 'REMOVE TABLE', 'TRUNCATE'], 'answer': 1},
        {'q': 'What is a primary key?', 'options': ['A key that locks tables', 'A unique identifier', 'A common join key', 'None'], 'answer': 1},
        {'q': 'Which function counts records?', 'options': ['SUM()', 'COUNT()', 'AVG()', 'TOTAL()'], 'answer': 1},
        {'q': 'What does DDL stand for?', 'options': ['Data Definition Language', 'Data Description Language', 'Dynamic Data Language', 'None'], 'answer': 0},
        {'q': 'How do you add a row?', 'options': ['ADD ROW', 'INSERT INTO', 'UPDATE', 'CREATE'], 'answer': 1}
    ],
    'machine-learning': [
        {'q': 'What type of learning uses labeled data?', 'options': ['Supervised', 'Unsupervised', 'Reinforcement', 'Semi-supervised'], 'answer': 0},
        {'q': 'Which algorithm is used for classification?', 'options': ['Linear Regression', 'K-Means', 'Logistic Regression', 'PCA'], 'answer': 2},
        {'q': 'What is overfitting?', 'options': ['Model performs well on training but poorly on test data', 'Model is too simple', 'Model is trained too fast', 'None'], 'answer': 0},
        {'q': 'What does CNN stand for?', 'options': ['Computer Network Node', 'Convolutional Neural Network', 'Complex Neural Network', 'None'], 'answer': 1},
        {'q': 'Which library is popular for ML?', 'options': ['Scikit-learn', 'React', 'Express', 'Django'], 'answer': 0},
        {'q': 'What is the target of unsupervised learning?', 'options': ['Finding hidden patterns', 'Predicting labels', 'Maximizing rewards', 'None'], 'answer': 0},
        {'q': 'What evaluates classification models?', 'options': ['MSE', 'R-squared', 'Confusion Matrix', 'MAE'], 'answer': 2},
        {'q': 'Which method scales features?', 'options': ['Standardization', 'Regularization', 'Tokenization', 'Bagging'], 'answer': 0},
        {'q': 'What is K in K-Means?', 'options': ['Iterations', 'Clusters', 'Data points', 'Features'], 'answer': 1},
        {'q': 'What does NLP stand for?', 'options': ['Natural Language Processing', 'Neural Link Protocol', 'Network Layer Parser', 'None'], 'answer': 0}
    ],
    'aws': [
        {'q': 'What does EC2 stand for?', 'options': ['Elastic Compute Cloud', 'Elastic Cloud Compute', 'Easy Compute Cloud', 'None'], 'answer': 0},
        {'q': 'Which service stores files?', 'options': ['RDS', 'S3', 'EC2', 'IAM'], 'answer': 1},
        {'q': 'What is the serverless computing service?', 'options': ['Lambda', 'Fargate', 'Beanstalk', 'App Runner'], 'answer': 0},
        {'q': 'Which AWS database is NoSQL?', 'options': ['RDS', 'DynamoDB', 'Aurora', 'Redshift'], 'answer': 1},
        {'q': 'What controls user access?', 'options': ['VPC', 'CloudWatch', 'IAM', 'Route 53'], 'answer': 2},
        {'q': 'Which service distributes incoming traffic?', 'options': ['ELB', 'Auto Scaling', 'CloudFront', 'Route 53'], 'answer': 0},
        {'q': 'What is a VPC?', 'options': ['Virtual Private Cloud', 'Virtual Protocol Center', 'Variable Power Core', 'None'], 'answer': 0},
        {'q': 'Which service deploys code automatically?', 'options': ['CodeDeploy', 'EC2', 'SNS', 'SQS'], 'answer': 0},
        {'q': 'What sends SMS/Email notifications?', 'options': ['SQS', 'SNS', 'SES', 'IAM'], 'answer': 1},
        {'q': 'What monitors cloud resources?', 'options': ['CloudTrail', 'CloudWatch', 'Inspector', 'Config'], 'answer': 1}
    ],
    'docker': [
        {'q': 'What defines steps to build a Docker image?', 'options': ['Docker-compose', 'Dockerfile', 'Docker Hub', 'Docker daemon'], 'answer': 1},
        {'q': 'How do you start a container?', 'options': ['docker build', 'docker run', 'docker start', 'docker create'], 'answer': 1},
        {'q': 'Which command lists running containers?', 'options': ['docker images', 'docker ps', 'docker run', 'docker status'], 'answer': 1},
        {'q': 'What separates containers from the host?', 'options': ['Namespaces/cgroups', 'Hypervisors', 'Virtual Machines', 'None'], 'answer': 0},
        {'q': 'What stores Docker images publicly?', 'options': ['Docker Cloud', 'Docker Hub', 'GitHub', 'Docker Registry'], 'answer': 1},
        {'q': 'How do you clean unused images?', 'options': ['docker prune', 'docker clean', 'docker remove', 'docker clear'], 'answer': 0},
        {'q': 'Which tool runs multi-container setups?', 'options': ['Swarm', 'Compose', 'Kubernetes', 'Machine'], 'answer': 1},
        {'q': 'What is a persistent data storage in Docker?', 'options': ['Layer', 'Cache', 'Volume', 'Image'], 'answer': 2},
        {'q': 'What runs inside a Docker image?', 'options': ['A full OS', 'Applications and dependencies', 'Only code', 'None'], 'answer': 1},
        {'q': 'How do you view logs of a container?', 'options': ['docker show', 'docker logs', 'docker view', 'docker print'], 'answer': 1}
    ],
    'css': [
        {'q': 'What does CSS stand for?', 'options': ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'None'], 'answer': 0},
        {'q': 'Which property changes text color?', 'options': ['background-color', 'text-color', 'color', 'font-color'], 'answer': 2},
        {'q': 'How do you select an ID?', 'options': ['.', '#', '*', '::'], 'answer': 1},
        {'q': 'Which display allows flexbox?', 'options': ['display: flex', 'display: box', 'display: block', 'display: grid'], 'answer': 0},
        {'q': 'What specifies space outside margins?', 'options': ['padding', 'margin', 'border', 'spacing'], 'answer': 1},
        {'q': 'Which property makes text bold?', 'options': ['font-weight', 'font-style', 'text-weight', 'font-size'], 'answer': 0},
        {'q': 'How do you center text?', 'options': ['align: center', 'text-align: center', 'vertical-align: middle', 'justify-content: center'], 'answer': 1},
        {'q': 'What creates space inside elements?', 'options': ['margin', 'padding', 'border', 'gap'], 'answer': 1},
        {'q': 'Which position is fixed relative to viewport?', 'options': ['absolute', 'relative', 'fixed', 'static'], 'answer': 2},
        {'q': 'How do you apply styles to hover states?', 'options': [':active', ':focus', ':hover', ':visited'], 'answer': 2}
    ],
    'html': [
        {'q': 'What does HTML stand for?', 'options': ['Hyper Text Markup Language', 'Hyperlinks and Text Markup', 'Home Tool Markup Language', 'None'], 'answer': 0},
        {'q': 'Which tag defines the largest heading?', 'options': ['<h6>', '<heading>', '<h1>', '<head>'], 'answer': 2},
        {'q': 'How do you insert a line break?', 'options': ['<lb>', '<br>', '<break>', '<newline>'], 'answer': 1},
        {'q': 'What is the tag for a hyperlink?', 'options': ['<a>', '<link>', '<href>', '<url>'], 'answer': 0},
        {'q': 'Which attribute specifies an image source?', 'options': ['href', 'src', 'alt', 'source'], 'answer': 1},
        {'q': 'What creates a checkbox?', 'options': ['<checkbox>', '<input type="checkbox">', '<input type="check">', 'None'], 'answer': 1},
        {'q': 'Which tag defines a table row?', 'options': ['<td>', '<th>', '<tr>', '<table>'], 'answer': 2},
        {'q': 'How do you make an ordered list?', 'options': ['<ul>', '<ol>', '<li>', '<list>'], 'answer': 1},
        {'q': 'Which tag holds metadata?', 'options': ['<head>', '<body>', '<title>', '<meta>'], 'answer': 0},
        {'q': 'Which HTML5 element plays video?', 'options': ['<media>', '<video>', '<movie>', '<source>'], 'answer': 1}
    ],
    'go': [
        {'q': 'How do you declare a variable in Go?', 'options': ['var x int', 'x := 10', 'Both', 'None'], 'answer': 2},
        {'q': 'What concurrency feature does Go use?', 'options': ['Threads', 'Coroutines', 'Goroutines', 'Promises'], 'answer': 2},
        {'q': 'How do you start a Goroutine?', 'options': ['run', 'start', 'go', 'async'], 'answer': 2},
        {'q': 'Which keyword handles multiple channel operations?', 'options': ['switch', 'case', 'select', 'channel'], 'answer': 2},
        {'q': 'What is the default value of an uninitialized int?', 'options': ['0', 'nil', '-1', 'undefined'], 'answer': 0},
        {'q': 'Does Go have classes?', 'options': ['Yes', 'No, it uses structs', 'Yes, using class keyword', 'None'], 'answer': 1},
        {'q': 'Which data type holds errors?', 'options': ['error', 'Exception', 'Err', 'Throwable'], 'answer': 0},
        {'q': 'What accesses slice capacity?', 'options': ['size()', 'len()', 'cap()', 'length()'], 'answer': 2},
        {'q': 'How do you import packages?', 'options': ['import "fmt"', 'require "fmt"', 'include "fmt"', 'load "fmt"'], 'answer': 0},
        {'q': 'Which command runs tests?', 'options': ['go test', 'go run', 'go build', 'go check'], 'answer': 0}
    ],
    'rust': [
        {'q': 'What manages memory safety in Rust?', 'options': ['Garbage Collector', 'Ownership model', 'Reference counting', 'Manual free'], 'answer': 1},
        {'q': 'How do you declare a mutable variable?', 'options': ['let mut x = 5;', 'let x = 5;', 'mut let x = 5;', 'var x = 5;'], 'answer': 0},
        {'q': 'What is Rust\'s package manager?', 'options': ['npm', 'cargo', 'pip', 'gem'], 'answer': 1},
        {'q': 'Which macro prints text?', 'options': ['println!()', 'print!()', 'printf!()', 'Both 1 & 2'], 'answer': 3},
        {'q': 'What is the borrow checker?', 'options': ['A tool that checks code out', 'Compiler pass ensuring safety', 'A memory allocator', 'None'], 'answer': 1},
        {'q': 'What defines shared behavior?', 'options': ['Interfaces', 'Traits', 'Abstract classes', 'Mixins'], 'answer': 1},
        {'q': 'What handles optional values?', 'options': ['Option<T>', 'Nullable<T>', 'Maybe<T>', 'None'], 'answer': 0},
        {'q': 'Is memory freed automatically?', 'options': ['Yes, via GC', 'Yes, when out of scope', 'No, manually', 'None'], 'answer': 1},
        {'q': 'What keyword defines a function?', 'options': ['def', 'fn', 'func', 'function'], 'answer': 1},
        {'q': 'Which type handles runtime failure gracefully?', 'options': ['Result<T, E>', 'Exception', 'Error', 'Option'], 'answer': 0}
    ]
}

for s in skills:
    if s not in pools: pools[s] = [{'q': f'Base {s}?', 'options': ['A','B','C','D'], 'answer': 0}]
    while len(pools[s]) < 10: pools[s].append(pools[s][0].copy())


for skill in skills:
    for diff in difficulties:
        data['quizzes'][f'{skill}_{diff}'] = pools[skill]

# --- RESOURCES ---
for skill in skills:
    data['resources'][skill] = {
        'beginner': {
            'courses': [{'name': f'Complete {skill} Bootcamp', 'platform': 'Udemy', 'url': f'https://www.udemy.com/topic/{skill}/', 'desc': 'Start here.'}],
            'tutorials': [{'name': f'Official {skill} Docs', 'url': f'https://docs.{skill}.org/', 'desc': 'Read the manual.'}],
            'practice': [{'name': f'{skill} Challenges', 'url': f'https://www.hackerrank.com/domains/{skill}', 'desc': 'Solve problems.'}]
        },
        'intermediate': {
            'courses': [{'name': f'Advanced {skill} Patterns', 'platform': 'Coursera', 'url': f'https://www.coursera.org/search?query={skill}', 'desc': 'Level up.'}],
            'tutorials': [{'name': f'{skill} Best Practices', 'url': f'https://github.com/trending/{skill}', 'desc': 'Learn from pros.'}],
            'practice': [{'name': f'{skill} Projects', 'url': f'https://leetcode.com/tag/{skill}/', 'desc': 'Build things.'}]
        },
        'advanced': {
            'courses': [{'name': f'Expert {skill} Systems', 'platform': 'edX', 'url': f'https://www.edx.org/search?q={skill}', 'desc': 'Mastery.'}],
            'tutorials': [{'name': f'{skill} Architecture', 'url': f'https://medium.com/tag/{skill}', 'desc': 'Deep dive.'}],
            'practice': [{'name': f'{skill} Open Source', 'url': f'https://github.com/search?q={skill}', 'desc': 'Contribute.'}]
        }
    }

# --- INTERNSHIPS ---
# Realistic location-based company & field mapping to improve accuracy
location_data = {
    'Remote': {
        'companies': ['GitLab', 'Zapier', 'Automattic', 'Stripe', 'Spotify', 'Shopify'],
        'fields': ['Software Development', 'UI/UX Design', 'Cloud/DevOps', 'Frontend', 'Backend', 'Full Stack']
    },
    'Bangalore': {
        'companies': ['Google', 'Microsoft', 'Amazon', 'Meta', 'Uber', 'Flipkart', 'PhonePe'],
        'fields': ['Software Development', 'Data Science', 'Cloud/DevOps', 'Cybersecurity', 'AI/ML Research', 'Backend', 'Full Stack']
    },
    'Hyderabad': {
        'companies': ['Microsoft', 'Amazon', 'Oracle', 'Qualcomm', 'ServiceNow'],
        'fields': ['Software Development', 'Cloud/DevOps', 'Product Management', 'Backend', 'Full Stack']
    },
    'Pune': {
        'companies': ['Persistent Systems', 'TCS', 'Infosys', 'Wipro', 'Barclays'],
        'fields': ['Software Development', 'Data Science', 'Cybersecurity', 'Frontend', 'Mobile App Development']
    },
    'Delhi NCR': {
        'companies': ['Zomato', 'Paytm', 'MakeMyTrip', 'TCS', 'HCLTech'],
        'fields': ['Software Development', 'UI/UX Design', 'Product Management', 'Mobile App Development', 'Frontend']
    },
    'Ahmedabad': {
        'companies': ['TCS', 'eInfochips', 'TatvaSoft', 'Gateway Group', 'Indus Net Technologies'],
        'fields': ['Software Development', 'UI/UX Design', 'Frontend', 'Backend', 'Mobile App Development', 'Full Stack']
    },
    'Mumbai': {
        'companies': ['JPMorgan Chase', 'Morgan Stanley', 'TCS', 'Reliance Jio', 'BookMyShow'],
        'fields': ['Software Development', 'Data Science', 'Cybersecurity', 'Blockchain', 'Full Stack']
    }
}

fields_skills = {
    'Software Development': ['Java', 'C++', 'Python'],
    'Data Science': ['Python', 'SQL', 'R'],
    'UI/UX Design': ['Figma', 'Adobe XD', 'HTML/CSS'],
    'Cloud/DevOps': ['AWS', 'Docker', 'Kubernetes'],
    'Cybersecurity': ['Linux', 'Wireshark', 'Network Security'],
    'Product Management': ['Agile', 'Jira', 'Analytics'],
    'Blockchain': ['Solidity', 'Ethereum', 'Rust'],
    'Frontend': ['React', 'Vue', 'JavaScript'],
    'Backend': ['Node.js', 'Django', 'PostgreSQL'],
    'Full Stack': ['MERN Stack', 'PostgreSQL', 'React'],
    'AI/ML Research': ['Python', 'PyTorch', 'TensorFlow'],
    'Mobile App Development': ['Flutter', 'React Native', 'Swift'],
    'Game Development': ['Unity', 'C#', 'C++']
}

id_counter = 1
for loc, loc_info in location_data.items():
    for comp in loc_info['companies']:
        for field in loc_info['fields']:
            title = f'{random.choice(["Junior", "Associate", "Graduate"])} {field} Intern'
            # Determine realistic stipend based on company tier
            if comp in ['Google', 'Microsoft', 'Amazon', 'Meta', 'Uber', 'Stripe', 'JPMorgan Chase']:
                stipend = random.choice(['45,000 INR/mo', '50,000 INR/mo', '60,000 INR/mo'])
            else:
                stipend = random.choice(['15,000 INR/mo', '20,000 INR/mo', '25,000 INR/mo'])
                
            duration = random.choice(['3 Months', '6 Months'])
            skills = fields_skills.get(field, ['General Tech', 'Problem Solving'])
            
            search_query = f"{title} internship {comp} {loc}".replace(" ", "+")
            
            data['internships'].append({
                'id': id_counter,
                'title': title,
                'company': comp,
                'logo': '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="4" fill="#8B0000"/><path d="M12 20h16M20 12v16" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/></svg>',
                'location': loc,
                'duration': duration,
                'stipend': stipend,
                'skills': skills,
                'requirements': skills,
                'field': field.lower(),
                'apply_link': f"https://www.google.com/search?q={search_query}"
            })
            id_counter += 1

# --- RECOMMENDATIONS ---
data['recommendations'] = [
    {'title': 'Full-Stack Web Architect', 'match_score': 92, 'description': 'Master both frontend and backend protocols.', 'required_skills': ['React', 'Node.js', 'PostgreSQL'], 'fields': ['web dev', 'fullstack'], 'avg_salary': '₹12L - ₹25L', 'growth': 'Steady +8%'},
    {'title': 'ML Operations Engineer', 'match_score': 88, 'description': 'Deploy and scale predictive AI models.', 'required_skills': ['Python', 'Docker', 'TensorFlow'], 'fields': ['ai & ml', 'data science'], 'avg_salary': '₹15L - ₹35L', 'growth': 'Exponential'},
    {'title': 'Cyber Defense Analyst', 'match_score': 85, 'description': 'Protect critical infrastructure from vectors.', 'required_skills': ['Kali Linux', 'Wireshark', 'Python'], 'fields': ['cybersecurity'], 'avg_salary': '₹10L - ₹22L', 'growth': 'Rapid +12%'},
    {'title': 'Blockchain Architect', 'match_score': 90, 'description': 'Develop decentralized ledger solutions.', 'required_skills': ['Solidity', 'Rust', 'Web3.js'], 'fields': ['blockchain'], 'avg_salary': '₹18L - ₹40L', 'growth': 'Highly Dynamic'},
    {'title': 'Cloud Infrastructure Lead', 'match_score': 87, 'description': 'Optimize cloud storage and compute pipelines.', 'required_skills': ['AWS', 'Terraform', 'Kubernetes'], 'fields': ['cloud computing', 'devops'], 'avg_salary': '₹14L - ₹30L', 'growth': 'High Yield'},
    {'title': 'Data Visualization Expert', 'match_score': 82, 'description': 'Translate raw data into actionable insights.', 'required_skills': ['Tableau', 'D3.js', 'Python'], 'fields': ['data science', 'ui/ux design'], 'avg_salary': '₹9L - ₹18L', 'growth': 'Stable'},
    {'title': 'AR/VR Developer', 'match_score': 79, 'description': 'Build immersive 3D spatial environments.', 'required_skills': ['Unity', 'C#', 'Blender'], 'fields': ['game dev', 'mobile apps'], 'avg_salary': '₹11L - ₹24L', 'growth': 'Emerging'},
    {'title': 'Mobile Systems Engineer', 'match_score': 84, 'description': 'Optimize performance for mobile hardware.', 'required_skills': ['Kotlin', 'Swift', 'Reactive Native'], 'fields': ['mobile apps'], 'avg_salary': '₹10L - ₹20L', 'growth': 'Consistent'},
    {'title': 'DevOps Automation Specialist', 'match_score': 89, 'description': 'Automate the software delivery lifecycle.', 'required_skills': ['Jenkins', 'Ansible', 'Bash'], 'fields': ['devops', 'cloud computing'], 'avg_salary': '₹13L - ₹28L', 'growth': 'Aggressive'},
    {'title': 'Lead UI/UX Strategist', 'match_score': 91, 'description': 'Design the next generation of digital interfaces.', 'required_skills': ['Figma', 'Adobe XD', 'Prototyping'], 'fields': ['ui/ux design', 'web dev'], 'avg_salary': '₹8L - ₹16L', 'growth': 'Steady'},
    {'title': 'Game Engine Programmer', 'match_score': 86, 'description': 'Write low-level code for physics and rendering.', 'required_skills': ['C++', 'OpenGL', 'Vulkan'], 'fields': ['game dev'], 'avg_salary': '₹14L - ₹32L', 'growth': 'Passionate'},
    {'title': 'FinTech Security Expert', 'match_score': 93, 'description': 'Secure global financial transaction matrices.', 'required_skills': ['C#', 'SQL', 'Cryptography'], 'fields': ['blockchain', 'cybersecurity'], 'avg_salary': '₹20L - ₹45L', 'growth': 'Critical'}
]

with open(r'c:\Academic-module\frontend\src\pages\student\career_data.js', 'w', encoding='utf-8') as f:
    f.write('export const careerData = ' + json.dumps(data, indent=2) + ';\n')
print('Data file created successfully!')
