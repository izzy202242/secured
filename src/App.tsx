import React, { useState, useEffect } from 'react';
import { Trophy, CreditCard, Wallet, TrendingUp, Award, BookOpen, ArrowLeft, Lock, Mail, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { supabase } from './lib/supabase';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  icon: React.ReactNode;
  story: string;
  questions: Question[];
}

interface User {
  email: string;
  name: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        loadUserData(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        loadUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile data with error handling
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (profileError) throw profileError;
      
      // Check if we got any profiles back
      if (!profiles || profiles.length === 0) {
        console.warn('No profile found for user');
        return;
      }

      const profile = profiles[0]; // Take the first profile

      setCurrentUser({
        email: profile.email,
        name: profile.name
      });
      setXp(profile.xp || 0);
      setStreak(profile.streak || 0);

      // Load completed lessons
      const { data: completed, error: completedError } = await supabase
        .from('completed_lessons')
        .select('lesson_id')
        .eq('user_id', userId);

      if (completedError) throw completedError;

      setCompletedLessons(completed?.map(c => c.lesson_id) || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't set error state here as it's not critical for the app to function
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');

      if (!email || !password || (isRegistering && !name)) {
        setError('Please fill in all fields');
        return;
      }

      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name
            }
          }
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLessonComplete = async (lessonId: number, points: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record completed lesson
      await supabase
        .from('completed_lessons')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          score: points
        });

      // Update user XP and streak
      const { error } = await supabase
        .from('profiles')
        .update({
          xp: xp + points,
          streak: streak + 1,
          streak_last_updated: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setXp(prev => prev + points);
      setStreak(prev => prev + 1);
      setCompletedLessons(prev => [...prev, lessonId]);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setXp(0);
    setStreak(0);
    setCompletedLessons([]);
  };

  const lessons: Lesson[] = [
    {
      id: 1,
      title: "Sarah's First Credit Card",
      description: "Help Sarah make smart decisions with her first credit card",
      points: 100,
      completed: false,
      icon: <CreditCard className="w-8 h-8 text-purple-500" />,
      story: "Sarah just got her first job out of college and received a credit card offer in the mail. She's excited about the opportunity to build her credit but nervous about making mistakes. Let's help Sarah make smart decisions!",
      questions: [
        {
          id: 1,
          text: "Sarah's credit card has a $3,000 limit. What's the maximum balance she should maintain to help her credit score?",
          options: [
            "$3,000 - use it all to build credit faster",
            "$2,400 - 80% of the limit",
            "$900 - 30% of the limit",
            "$0 - never use credit cards"
          ],
          correctAnswer: 2,
          explanation: "It's best to keep your credit utilization below 30%. For a $3,000 limit, try to keep your balance under $900. This shows lenders you can manage credit responsibly without relying too heavily on it."
        },
        {
          id: 2,
          text: "Sarah forgot to pay her credit card bill last month. What should she do?",
          options: [
            "Ignore it, one missed payment isn't a big deal",
            "Call the credit card company immediately and make the payment",
            "Wait for the next bill and pay double",
            "Close the credit card account"
          ],
          correctAnswer: 1,
          explanation: "Contact your credit card company immediately! A late payment can hurt your credit score, but many companies will waive the late fee for first-time mistakes if you act quickly and have a good payment history."
        }
      ]
    },
    {
      id: 2,
      title: "Maya's Debt Dilemma",
      description: "Help Maya create a plan to tackle her student loans and credit card debt",
      points: 100,
      completed: false,
      icon: <Wallet className="w-8 h-8 text-green-500" />,
      story: "Maya has graduated with $25,000 in student loans and $3,000 in credit card debt from emergencies during school. She's starting a new job and wants to create a debt repayment strategy.",
      questions: [
        {
          id: 1,
          text: "Which debt should Maya prioritize paying off first?",
          options: [
            "Student loans because the balance is higher",
            "Split payments equally between both debts",
            "Credit card debt because of higher interest rates",
            "Whichever loan has the lowest balance"
          ],
          correctAnswer: 2,
          explanation: "Credit card debt typically has much higher interest rates (15-25%) compared to student loans (4-7%). Prioritizing high-interest debt while making minimum payments on other debts will save you more money in the long run."
        }
      ]
    },
    {
      id: 3,
      title: "Lisa's Credit Building Journey",
      description: "Guide Lisa through building her credit score from scratch",
      points: 100,
      completed: false,
      icon: <TrendingUp className="w-8 h-8 text-blue-500" />,
      story: "Lisa is 22 and has no credit history. She's been denied for apartments and realizes she needs to start building her credit. Let's help her get started on the right path!",
      questions: [
        {
          id: 1,
          text: "What's the best first step for Lisa to start building credit?",
          options: [
            "Apply for multiple credit cards at once",
            "Get a secured credit card",
            "Take out a personal loan",
            "Become an authorized user on someone's credit card"
          ],
          correctAnswer: 1,
          explanation: "A secured credit card is perfect for building credit. You provide a security deposit that becomes your credit limit, minimizing the bank's risk. This makes it easier to get approved with no credit history."
        }
      ]
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!selectedLesson) return;
    
    if (currentQuestionIndex + 1 < selectedLesson.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      if (!completedLessons.includes(selectedLesson.id)) {
        handleLessonComplete(selectedLesson.id, selectedLesson.points);
      }
      setSelectedLesson(null);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Trophy className="w-12 h-12 text-purple-600" />
            <h1 className="text-3xl font-bold text-purple-600 ml-3">Secured</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-6">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {isRegistering
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-600">Secured</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{xp} XP</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-red-500" />
              <span className="font-semibold">{streak} Day Streak</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <span className="font-semibold">{currentUser?.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Your Journey to Financial Freedom
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Learn essential financial skills through real-life scenarios. 
            Make smart decisions, build your credit, and secure your financial future!
          </p>
        </div>

        {selectedLesson ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => {
                  setSelectedLesson(null);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                }}
                className="flex items-center text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Lessons
              </button>
            </div>
            
            <h3 className="text-2xl font-bold mb-4">{selectedLesson.title}</h3>
            
            {currentQuestionIndex === 0 && (
              <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{selectedLesson.story}</p>
              </div>
            )}
            
            <div className="mb-8">
              <h4 className="text-xl font-semibold mb-4">
                Question {currentQuestionIndex + 1} of {selectedLesson.questions.length}
              </h4>
              <p className="text-gray-700 mb-6">{selectedLesson.questions[currentQuestionIndex].text}</p>
              
              <div className="space-y-4">
                {selectedLesson.questions[currentQuestionIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={`w-full p-4 text-left rounded-lg transition-colors ${
                      selectedAnswer === index
                        ? index === selectedLesson.questions[currentQuestionIndex].correctAnswer
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-red-100 border-2 border-red-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {showExplanation && (
              <div className="mb-8">
                <div className={`p-4 rounded-lg ${
                  selectedAnswer === selectedLesson.questions[currentQuestionIndex].correctAnswer
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h5 className="font-semibold mb-2">
                    {selectedAnswer === selectedLesson.questions[currentQuestionIndex].correctAnswer
                      ? 'Correct! Here\'s why:'
                      : 'Not quite. Here\'s the explanation:'}
                  </h5>
                  <p className="text-gray-700">
                    {selectedLesson.questions[currentQuestionIndex].explanation}
                  </p>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  {currentQuestionIndex + 1 < selectedLesson.questions.length
                    ? 'Next Question'
                    : `Complete Lesson (+${selectedLesson.points} XP)`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`bg-white rounded-lg shadow-lg p-6 transition-shadow ${
                  completedLessons.includes(lesson.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-xl cursor-pointer'
                }`}
                onClick={() => !completedLessons.includes(lesson.id) && setSelectedLesson(lesson)}
              >
                <div className="flex items-center justify-between mb-4">
                  {lesson.icon}
                  <span className="text-sm font-semibold text-purple-600">
                    +{lesson.points} XP
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
                <p className="text-gray-600">{lesson.description}</p>
                {completedLessons.includes(lesson.id) && (
                  <div className="mt-4 flex items-center text-green-600">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;