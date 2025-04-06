
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Translate } from 'lucide-react';

interface TranslationToggleProps {
  className?: string;
}

const TranslationToggle = ({ className }: TranslationToggleProps) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('medilink-language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      translatePage(savedLanguage);
    }
  }, []);

  const translatePage = (languageCode: string) => {
    // Save language preference
    localStorage.setItem('medilink-language', languageCode);
    setCurrentLanguage(languageCode);
    
    // In a real application, this would integrate with a translation API
    // For this demo, we're just simulating translation
    console.log(`Page would be translated to ${languageCode}`);
    
    if (languageCode === 'en') {
      // Reset translations (remove data-original attributes)
      document.querySelectorAll('[data-original]').forEach(element => {
        if (element.textContent && element.getAttribute('data-original')) {
          element.textContent = element.getAttribute('data-original') || '';
          element.removeAttribute('data-original');
        }
      });
      return;
    }
    
    // Simple demonstration of how translation would work
    // In a real app, this would use a proper i18n library or translation API
    const translateableElements = document.querySelectorAll('h1, h2, h3, p, button, label, span, a');
    
    translateableElements.forEach((element) => {
      if (element.textContent && element.textContent.trim() && !element.getAttribute('data-original')) {
        // Store original text if not already stored
        element.setAttribute('data-original', element.textContent);
        
        // Apply a simulated translation (for demo purposes only)
        // In a real app, this would use actual translations from a service
        if (languageCode === 'es') {
          element.textContent = `${element.textContent} [ES]`;
        } else if (languageCode === 'fr') {
          element.textContent = `${element.textContent} [FR]`;
        } else if (languageCode === 'de') {
          element.textContent = `${element.textContent} [DE]`;
        } else if (languageCode === 'zh') {
          element.textContent = `${element.textContent} [ZH]`;
        } else if (languageCode === 'ar') {
          element.textContent = `${element.textContent} [AR]`;
        } else if (languageCode === 'hi') {
          element.textContent = `${element.textContent} [HI]`;
        }
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <Translate className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => translatePage(language.code)}
            className={currentLanguage === language.code ? "bg-slate-100 font-medium" : ""}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TranslationToggle;
