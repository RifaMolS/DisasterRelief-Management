import React, { useState, useEffect, useRef } from 'react';

const SearchableDropdown = ({ options, value, onChange, placeholder, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 16px',
                    borderRadius: '50rem',
                    color: value ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '40px',
                    transition: 'all 0.2s ease'
                }}
            >
                {value || placeholder}
                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8em', opacity: 0.7 }}>▼</span>
            </div>
            
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)',
                    padding: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                    <input 
                        autoFocus
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            outline: 'none'
                        }}
                    />
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</div>
                    ) : (
                        filteredOptions.map((opt, i) => (
                            <div 
                                key={i}
                                onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                                style={{
                                    padding: '8px 12px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: '0.2s',
                                    fontSize: '0.95rem'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                {opt}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
