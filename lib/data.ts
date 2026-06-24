// Mock data for Mohit Shah's profile
export const mockProfile = {
  personalInfo: {
    firstName: "Mohit",
    lastName: "Shah",
    email: "mohit.shah@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/mohitshah",
    github: "github.com/mohitshah",
    portfolio: "mohitshah.dev",
    summary: "Results-driven Data Analyst and Software Developer with 4+ years of experience transforming complex datasets into actionable insights. Proficient in Python, SQL, and modern BI tools. Passionate about building data-driven solutions that drive business growth."
  },
  education: [
    {
      id: "1",
      institution: "University of California, Berkeley",
      degree: "Master of Science",
      field: "Data Science",
      startDate: "2020",
      endDate: "2022",
      gpa: "3.9"
    },
    {
      id: "2",
      institution: "San Jose State University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.7"
    }
  ],
  experience: [
    {
      id: "1",
      company: "TechCorp Analytics",
      position: "Senior Data Analyst",
      location: "San Francisco, CA",
      startDate: "Jan 2023",
      endDate: "Present",
      description: [
        "Led data analysis initiatives resulting in 25% improvement in customer retention rates",
        "Developed automated reporting dashboards using Power BI and Tableau serving 50+ stakeholders",
        "Implemented machine learning models for predictive analytics, reducing churn by 18%",
        "Collaborated with cross-functional teams to identify $2M in cost-saving opportunities"
      ]
    },
    {
      id: "2",
      company: "DataDriven Inc.",
      position: "Data Analyst",
      location: "San Jose, CA",
      startDate: "Jun 2020",
      endDate: "Dec 2022",
      description: [
        "Analyzed large datasets using Python, Pandas, and SQL to extract business insights",
        "Created interactive dashboards and visualizations for executive leadership",
        "Optimized ETL pipelines reducing data processing time by 40%",
        "Mentored junior analysts on best practices in data analysis and visualization"
      ]
    }
  ],
  projects: [
    {
      id: "1",
      name: "AI Resume Builder",
      description: "Full-stack application that generates ATS-optimized resumes using NLP and machine learning algorithms",
      technologies: ["Python", "Next.js", "OpenAI API", "PostgreSQL"],
      link: "github.com/mohitshah/resume-builder",
      highlights: [
        "Processed 10,000+ job descriptions to train keyword extraction model",
        "Achieved 95% ATS compatibility score across major recruiting platforms"
      ]
    },
    {
      id: "2",
      name: "AI Data Cleaning Dashboard",
      description: "Automated data cleaning and preprocessing tool with intelligent anomaly detection",
      technologies: [
        "Python",
        "Streamlit",
        "Pandas",
        "NumPy",
        "Scikit-Learn",
        "Matplotlib",
        "Plotly",
        "OpenPyXL",
        "Python Datetime Library",
        "Regular Expressions (Regex)",
        "Machine Learning Algorithms",
        "Isolation Forest",
        "Z-Score Analysis",
        "IQR (Interquartile Range)",
        "Git",
        "GitHub",
        "VS Code"
      ],
      link: "github.com/mohitshah/data-cleaner",
      highlights: [
        "Reduced data preparation time by 60% for data science teams",
        "Implemented ML-based outlier detection with 92% accuracy"
      ]
    },
    {
      id: "3",
      name: "HR Analytics Platform",
      description: "Comprehensive HR analytics solution for employee performance and attrition analysis",
      technologies: [
        "Python",
        "SQL",
        "Power BI",
        "Pandas",
        "NumPy",
        "Scikit-Learn",
        "Matplotlib",
        "Seaborn",
        "Jupyter Notebook",
        "SQL Server / MySQL",
        "Excel",
        "Git",
        "GitHub",
        "VS Code"
      ],
      link: "github.com/mohitshah/hr-analytics",
      highlights: [
        "Predicted employee attrition with 87% accuracy using ensemble methods",
        "Deployed interactive dashboards used by 200+ HR professionals"
      ]
    },
    {
      id: "4",
      name: "Customer Personality Analysis",
      description: "Customer segmentation and personality profiling using clustering algorithms",
      technologies: ["Python", "NumPy", "Matplotlib", "K-Means"],
      link: "github.com/mohitshah/customer-analysis",
      highlights: [
        "Identified 5 distinct customer segments driving targeted marketing campaigns",
        "Increased marketing ROI by 35% through personalized recommendations"
      ]
    }
  ],
  skills: {
    programming: ["Python", "SQL", "JavaScript", "TypeScript"],
    dataAnalysis: [
      "Pandas",
      "NumPy",
      "Scikit-Learn",
      "Data Cleaning",
      "Exploratory Data Analysis (EDA)",
      "Feature Engineering",
      "Statistical Analysis",
      "Machine Learning",
      "Predictive Analytics"
    ],
    visualization: ["Power BI", "Tableau", "Matplotlib", "Seaborn", "Plotly", "Microsoft Excel"],
    databases: ["MySQL", "SQL Server", "Firebase"],
    cloud: [] as string[],
    tools: ["Streamlit", "Git", "GitHub", "Jupyter Notebook", "VS Code", "Anaconda", "DataGrip"]
  },
  certifications: [
    {
      id: "1",
      name: "AWS Certified Data Analytics",
      issuer: "Amazon Web Services",
      date: "2023",
      credentialId: "AWS-DA-2023"
    },
    {
      id: "2",
      name: "Google Data Analytics Professional",
      issuer: "Google",
      date: "2022",
      credentialId: "GDAP-2022"
    },
    {
      id: "3",
      name: "Microsoft Power BI Data Analyst",
      issuer: "Microsoft",
      date: "2022",
      credentialId: "PL-300"
    }
  ],
  achievements: [
    "Speaker at DataConf 2023 on 'ML in Production'",
    "Published research on predictive analytics in IEEE",
    "Winner of Kaggle Competition - Customer Churn Prediction",
    "Open source contributor with 500+ GitHub stars"
  ]
}

export const mockResumes = [
  {
    id: "1",
    jobTitle: "Senior Data Analyst",
    company: "Google",
    atsScore: 92,
    createdAt: "2024-01-15",
    template: "FAANG",
    status: "completed"
  },
  {
    id: "2",
    jobTitle: "Data Scientist",
    company: "Meta",
    atsScore: 88,
    createdAt: "2024-01-12",
    template: "Harvard",
    status: "completed"
  },
  {
    id: "3",
    jobTitle: "Business Analyst",
    company: "McKinsey",
    atsScore: 95,
    createdAt: "2024-01-10",
    template: "Consulting",
    status: "completed"
  },
  {
    id: "4",
    jobTitle: "ML Engineer",
    company: "OpenAI",
    atsScore: 85,
    createdAt: "2024-01-08",
    template: "FAANG",
    status: "completed"
  },
  {
    id: "5",
    jobTitle: "Analytics Manager",
    company: "Stripe",
    atsScore: 90,
    createdAt: "2024-01-05",
    template: "Corporate",
    status: "completed"
  }
]

export const dashboardStats = {
  totalResumes: 24,
  avgAtsScore: 89,
  applicationsPrepared: 18,
  profileCompletion: 85
}

export const recentActivity = [
  { id: "1", action: "Generated resume for Google", time: "2 hours ago" },
  { id: "2", action: "Updated work experience", time: "5 hours ago" },
  { id: "3", action: "Added new certification", time: "1 day ago" },
  { id: "4", action: "Generated resume for Meta", time: "3 days ago" },
  { id: "5", action: "Updated skills section", time: "5 days ago" }
]
