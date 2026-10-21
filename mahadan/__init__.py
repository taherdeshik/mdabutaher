"""মহাদান ইউনিয়ন প্রচারণা প্ল্যাটফর্ম — Django project package."""

# Optional: use PyMySQL as a drop-in MySQLdb replacement (pure Python, no C build
# needed on cPanel shared hosting). Only active when PyMySQL is installed.
try:  # pragma: no cover - environment dependent
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:  # pragma: no cover
    pass
