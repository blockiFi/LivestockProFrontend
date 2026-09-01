# LiveStock Pro Frontend

A modern, responsive frontend application for comprehensive livestock management built with React, TypeScript, and Vite. This application provides an intuitive interface for managing poultry farms, health records, and inventory tracking.

## 🌟 Features

### 🐔 Poultry Management
- **Flock Dashboard**: Comprehensive flock overview with real-time data
- **Daily Records**: Interactive forms for daily health and production tracking
- **Batch Scheduling**: Visual scheduling interface for feeding and care activities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 💊 Health & Medication Management
- **Medication Records**: 
  - Add new medication records with dosage calculations
  - View comprehensive medication history
  - Delete records with inventory restoration
  - Real-time cost calculations
- **Vaccination Records**:
  - Professional vaccination record creation
  - Complete vaccination history tracking
  - Inventory-integrated vaccine management
  - Automatic cost computation
- **Inventory Integration**: Real-time stock updates and validation
- **Professional UI**: Modern modals with form validation and error handling

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with shadcn/ui components
- **Confirmation Dialogs**: Professional delete confirmation with detailed information
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Layout**: Mobile-first design with tablet and desktop optimization

### 📊 Advanced Features
- **Real-time Data**: Live updates from backend API
- **Cost Calculations**: Automatic cost computation based on dosage and inventory
- **Inventory Validation**: Real-time stock checking before record creation
- **Professional Modals**: Feature-rich forms with validation and feedback
- **Audit Trail**: Visual representation of record history and changes

## 🚀 Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: React hooks and context
- **API Integration**: Fetch API with error handling
- **Form Handling**: React Hook Form with validation
- **Routing**: React Router for navigation
- **Icons**: Lucide React for consistent iconography

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/blockiFi/LivestockProFrontend.git
   cd LivestockProFrontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API backend URL:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### API Configuration
Update your `.env` file with backend API URL:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### UI Theme Configuration
The application uses a modern theme with:
- Primary colors: Blue tones for actions
- Secondary colors: Gray tones for backgrounds
- Accent colors: Green for success, Red for danger
- Professional typography with clear hierarchy

## 📱 Key Components

### Core Components
- **FlockPage**: Main flock management interface
- **MedicationRecordView**: Medication history and management
- **VaccinationRecordView**: Vaccination tracking interface
- **AddMedicationRecordModal**: Professional medication record creation
- **AddVaccinationRecordModal**: Comprehensive vaccination record form
- **DeleteConfirmationDialog**: Professional delete confirmation with details

### UI Components
- **Modern Modals**: Feature-rich forms with validation
- **Data Tables**: Responsive tables with sorting and filtering
- **Alert Dialogs**: Professional confirmation dialogs
- **Form Controls**: Validated input components
- **Loading States**: Smooth loading indicators

## 🎯 Key Features Implementation

### Medication Management
- **Add Records**: Complete form with product selection, dosage calculation, and cost computation
- **View History**: Comprehensive table with all medication records
- **Delete Records**: Professional confirmation dialog with inventory restoration
- **Validation**: Real-time form validation and error handling

### Vaccination Management
- **Professional Forms**: Feature-rich vaccination record creation
- **Inventory Integration**: Real-time stock validation and updates
- **Cost Calculations**: Automatic cost computation based on vaccine and dosage
- **History Tracking**: Complete vaccination history with detailed information

### User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: Comprehensive error handling with user feedback
- **Professional UI**: Modern, clean interface with consistent styling

## 🧪 Development

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── modals/          # Modal components
│   └── poultry/         # Poultry-specific components
├── pages/               # Page components
├── lib/                 # Utility functions and API
├── hooks/               # Custom React hooks
├── store/               # State management
└── routes/              # Routing configuration
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture
- Custom hooks for logic reuse

## 🔗 API Integration

The frontend integrates with the LiveStock Pro Backend API:
- **Authentication**: Secure API access
- **CRUD Operations**: Complete create, read, update, delete operations
- **Real-time Updates**: Live data synchronization
- **Error Handling**: Comprehensive API error handling
- **Validation**: Client and server-side validation

## 🤝 Contributing

We welcome contributions to LiveStock Pro Frontend! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components when possible
- Maintain responsive design principles
- Add proper error handling and loading states
- Write meaningful commit messages

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the component documentation
- Review the API integration guide

## 🎯 Roadmap

- [ ] Advanced data visualization charts
- [ ] Mobile app version (React Native)
- [ ] Offline mode capabilities
- [ ] Real-time notifications
- [ ] Advanced filtering and search
- [ ] Export/import functionality
- [ ] Multi-language support
- [ ] Dark mode theme

## 📸 Screenshots

### Flock Management
- Modern dashboard with real-time data
- Responsive design for all devices
- Professional medication and vaccination management

### Key Features
- **Professional Modals**: Feature-rich forms with validation
- **Delete Confirmations**: Professional confirmation dialogs
- **Real-time Updates**: Live data synchronization
- **Error Handling**: User-friendly error messages

---

Built with ❤️ for modern livestock management using React + TypeScript + Vite
